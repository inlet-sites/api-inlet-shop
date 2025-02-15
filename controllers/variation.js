import {Product, Variation} from "../models/product.js";

import {CustomError} from "../CustomError.js";
import validate from "../validation/variation.js";
import {decrypt, newUUID} from "../crypto.js";
import sharp from "sharp";
import fs from "fs";

const createVariation = async (req, res, next)=>{
    try{
        validate(req.body);
        const product = await getProduct(req.body.product);
        validateOwnership(product, res.locals.vendor._id.toString());
        const variation = await newVariation(
            req.body,
            product._id.toString(),
            res.locals.vendor.stripe.validated
        );
        if(req.files) variation.images = addImages(req.files.images);
        product.variations.push(variation);
        await product.save();
        res.json(responseVariation(variation));
    }catch(e){next(e)}
}

const removeVariation = async (req, res, next)=>{
    try{
        const product = await getProduct(req.params.productId);
        validateOwnership(product, res.locals.vendor._id.toString());
        let variation = archiveVariation(product, req.params.variationId);
        variation.images = removeImages(variation.images, Array.from(variation.images));
        await product.save();
        res.json({success: true});
    }catch(e){next(e)}
}

const addImagesRoute = async (req, res, next)=>{
    try{
        const {product, variation} = await getVariation(req.params.productId, req.params.variationId);
        validateOwnership(product, res.locals.vendor._id.toString());
        variation.images = variation.images.concat(addImages(req.files.images));
        await product.save();
        res.json(responseVariation(variation));
    }catch(e){next(e)}
}

const removeImagesRoute = async (req, res, next)=>{
    try{
        const {product, variation} = await getVariation(req.params.productId, req.params.variationId);
        validateOwnership(product, res.locals.vendor._id.toString());
        variation.images = removeImages(variation.images, req.body.images);
        await product.save();
        res.json(responseVariation(variation));
    }catch(e){next(e)}
}

/*
 Retrieve product
 If vendor ID is also passed, verify ownership

 @param {String ID} productId - ID of the product to retrieve
 @return {Product} The retrieved product
 */
const getProduct = async (productId)=>{
    const product = await Product.findOne({_id: productId});
    if(!product) throw new CustomError(400, "No product with that ID");
    return product;
}

/*
 Retrieve both product and variation

 @param {String} productId - ID of the product to retrieve
 @param {String} variationId - ID of the variation to retrieve
 @return {{Product, Variation}} - Object containing both Product and Variation
 */
const getVariation = async (productId, variationId)=>{
    const product = await getProduct(productId);
    if(!product) throw new CustomError(400, "No product with that ID");
    let variation;
    for(let i = 0; i < product.variations.length; i++){
        if(product.variations[i]._id.toString() === variationId){
            variation = product.variations[i];
        }
    }
    if(!variation) throw new CustomError(400, "No variation with that ID");
    return {product, variation};
}

/*
 Throw error if vendor does not own the product
 
 @param {Product} product - Product object
 @param {String} vendorID - Id of the vendor to verify
 */
const validateOwnership = (product, vendorId)=>{
    if(product.vendor.toString() !== vendorId){
        throw new CustomError(403, "Forbidden");
    }
}

/*
 Find and archive the designated variation on a product

 @param {Product} product - Product object
 @param {String} variationId - ID of the variation to be archived
 */
const archiveVariation = (product, variationId)=>{
    for(let i = 0; i < product.variations.length; i++){
        if(product.variations[i]._id.toString() === variationId){
            product.variations[i].archived = true;
            return product.variations[i];
        }
    }
    throw new CustomError(400, "Variation with this ID does not exist");
}

/*
 Creates a new Variation object with only necessary data

 @param {Object} data - All body data from request
 @param {String ID} productId - Product ID that the variation belongs to
 @param {Boolean} stripeValidated - Whether the user has a Stripe account
 @return {Variation} Newly created variation
 */
const newVariation = async (data, productId, stripeValidated)=>{
    const variation = new Variation({
        product: productId,
        descriptor: data.descriptor,
        price: data.price,
        quantity: data.quantity,
        shipping: data.shipping,
        images: [],
        purchaseOption: stripeValidated ? data.purchaseOption : "list",
        archived: false
    });

    return variation;
}

/*
 Resize all files and change to webp
 Create and return a list of files

 @param {File | [File]} files - A single file or a list of files
 @return {[String]} List of file names
 */
const addImages = (files)=>{
    if(!files.length) files = [files];
    const promises = [];
    const newFiles = [];

    for(let i = 0; i < files.length; i++){
        const uuid = newUUID();
        const filename = `${uuid}.webp`;
        promises.push(
            sharp(files[i].data)
                .resize({width: 1000})
                .webp({quality: 75})
                .toFile(`${global.cwd}/documents/${filename}`)
        );
        newFiles.push(filename);
    }

    Promise.all(promises);
    return newFiles;
}

/*
 Remove images from server
 Remove images from variation

 @param {[String]} imagesArray - Array of images from the database
 @param {[String]} removeImages - Array of images to be removed
 @return {[String]} resulting array of images that still remain
 */
const removeImages = (imagesArray, removeImages)=>{
    for(let i = 0; i < removeImages.length; i++){
        for(let j = 0; j < imagesArray.length; j++){
            if(removeImages[i] === imagesArray[j]){
                fs.unlink(`${global.cwd}/documents/${removeImages[i]}`, (err)=>{if(err) console.error(err)});
                imagesArray.splice(j, 1);
                break;
            }
        }
    }
    return imagesArray;
}

/*
 Create the data to be returned to user/vendor from the full Variation

 @param {Variation} variation - Full Variation object
 @return {Object} Object containing data to use in the response
 */
const responseVariation = (variation)=>{
    return {
        id: variation._id,
        product: variation.product,
        descriptor: variation.descriptor,
        price: variation.price,
        quantity: variation.quantity,
        shipping: variation.shipping,
        images: variation.images,
        purchaseOption: variation.purchaseOption
    };
}

export {
    createVariation,
    removeVariation,
    addImagesRoute,
    removeImagesRoute
};
