import {Product} from "../models/product.js";

import validate from "../validation/product.js";
import {decrypt, newUUID} from "../crypto.js";
import sharp from "sharp";
import stripePack from "stripe";
import fs from "fs";
import mongoose from "mongoose";

const createRoute = async (req, res, next)=>{
    try{
        const data = {
            ...req.body,
            tags: JSON.parse(req.body.tags),
            active: req.body.active === "true" ? true : false
        };
        validate(data);
        const product = createProduct(data, res.locals.vendor._id);
        if(res.locals.vendor.stripeToken){
            product.stripeId = await createStripeProduct(
                res.locals.vendor.stripeToken,
                data.name,
                data.active
            );
        }
        if(req.files) product.images = await addImages(req.files.images);
        await product.save();
        res.json(responseProduct(product));
    }catch(e){next(e)}
}

const deleteRoute = async (req, res, next)=>{
    try{
        let product = await getProduct(req.params.productId);
        validateOwnership(product, res.locals.vendor._id.toString());
        product = deleteAllImages(product);
        product.archived = true;
        await product.save();
        archiveStripeProduct(res.locals.vendor.stripeToken, product.stripeId);
        res.json({success: true});
    }catch(e){next(e)}
}

const getRoute = async (req, res, next)=>{
    try{
        const products = await getAllVendorProducts(req.params.vendorId, false);
        res.json(products);
    }catch(e){next(e)}
}

const vendorGetRoute = async (req, res, next)=>{
    try{
        const products = await getAllVendorProducts(res.locals.vendor._id, true);
        res.json(products);
    }catch(e){next(e)}
}

const getOneRoute = async (req, res, next)=>{
    try{
        const product = await getProduct(req.params.productId);
        res.json(responseProduct(product));
    }catch(e){next(e)}
}

const addImagesRoute = async (req, res, next)=>{
    try{
        const product = await getProduct(req.params.productId);
        validateOwnership(product, res.locals.vendor._id.toString());
        product.images = product.images.concat(await addImages(req.files.images));
        product.save();
        res.json(responseProduct(product));
    }catch(e){next(e)}
}

const removeImagesRoute = async (req, res, next)=>{
    try{
        let product = await getProduct(req.params.productId);
        validateOwnership(product, res.locals.vendor._id.toString());
        product = removeImages(req.body.images, product);
        await product.save();
        res.json(responseProduct(product));
    }catch(e){next(e)}
}

const updateRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        let product = await getProduct(req.params.productId);
        validateOwnership(product, res.locals.vendor._id.toString());
        product = await updateProduct(req.body, product, res.locals.vendor.stripeToken);
        await product.save();
        res.json(responseProduct(product));
    }catch(e){next(e)}
}

/*
 Get product from ID
 Throws error if product doesn't exist

 @param {String} productId - unique ID of the product
 @return {Product} Product object
 */
const getProduct = async (productId)=>{
    const product = await Product.findOne({_id: productId});
    if(!product) throw new CustomError(400, "Product with this ID doesn't exist");
    return product;
}

/*
 Get all products from a specific vendor, including variations

 @param {String} vendorId - ID of the vendor
 @return {[Product]} List of Product objects
 */
const getAllVendorProducts = async (vendorId, forVendor)=>{
    let match = {$match: {
        vendor: new mongoose.Types.ObjectId(vendorId),
        archived: false
    }};
    let project = {$project: {
        _id: 0,
        vendor: 0,
        archived: 0,
        stripeId: 0,
        "variations.priceId": 0,
        "variations.archived": 0
    }};
    if(!forVendor){
        match["$match"].active = true;
        project["$project"].active = 0;
    }

    return await Product.aggregate([
        match,
        {$addFields: {id: "$_id"}},
        project
    ]);
}

/*
 Throw an error if vendor does not owne the project

 @param {Product} product - Product object
 @param {String} vendorId - ID of the vendor
 */
const validateOwnership = (product, vendorId)=>{
    if(product.vendor.toString() !== vendorId) throw new CustomError(403, "Forbidden");
}

/*
 Delete all image files from the server for a single product

 @param {Product} product - Product object
 @return {Product} - Product with image arrays emptied
 */
const deleteAllImages = (product)=>{
    for(let i = 0; i < product.images.length; i++){
        fs.unlink(`${global.cwd}/documents/${product.images[i]}`, (err)=>{
            console.error(err);
        });
    }
    product.images = [];

    for(let i = 0; i < product.variations.length; i++){
        for(let j = 0; j < product.variations[i].images.length; j++){
            fs.unlink(`${global.cwd}/documents/${product.variations[i].images[j]}`, (err)=>{
                console.error(err);
            });
        }
        product.variations[i].images = [];
    }

    return product;
}

/*
 Create and return a new Product object

 @params {Object} data - Object contaning all product data
 @params {String} vendorId - Vendor ID
 @params {Product} Product object
 */
const createProduct = (data, vendorId)=>{
    return new Product({
        vendor: vendorId,
        name: data.name,
        tags: data.tags,
        images: [],
        description: data.description,
        variations: [],
        active: data.active,
        archived: false
    });
}

/*
 Set images to set size
 Convert to webp
 Save images to disk
 Return list of file names

 @param {File | [File]} files - Single file or a list of files
 @return {[String]} List containing filenames of the saved files
 */
const addImages = async (files)=>{
    if(!files.length) files = [files];
    const promises = [];
    const newFiles = [];

    for(let i = 0; i < files.length; i++){
        let uuid = newUUID();
        const fileName = `${uuid}.webp`;
        promises.push(
            sharp(files[i].data)
                .resize({width: 1000})
                .webp({quality: 75})
                .toFile(`${global.cwd}/documents/${fileName}`)
        );
        newFiles.push(fileName);
    }

    await Promise.all(promises);
    return newFiles;
}

/*
 Removes images from a product and deletes them from the server.
 Returns a Product with the images removed.

 @param {[string]} images - Image file names to be removed
 @param {Product} product - full product object
 @return {Product} Full Product object with the images removed
 */
const removeImages = (images, product)=>{
    for(let i = 0; i < images.length; i++){
        const idx = product.images.indexOf(images[i]);
        if(idx !== -1){
            product.images.splice(idx, 1);
            fs.unlink(`${global.cwd}/documents/${images[i]}`, (err)=>{
                if(err) console.error(err);
            });
        }
    }

    return product;
}

/*
 Create new product on Stripe

 @param {String} token - Vendor Stripe token
 @param {String} name - Name of the product
 @param {Boolean} active - Whether the product is active or not
 @return {String} Stripe ID for the product
 */
const createStripeProduct = async (token, name, active)=>{
    const stripe = stripePack(decrypt(token));

    const product = await stripe.products.create({
        name: name,
        active: active
    });

    return product.id;
}

const archiveStripeProduct = async (token, productId)=>{
    const stripe = stripePack(decrypt(token));

    await stripe.products.update(
        productId,
        {active: false}
    );
}

/*
 Checks validity of input data
 Updates the information on the product
 Updates Stripe product/price data as necessary

 @param {Object} data - Data from the request body
 @param {Product} product - The product to be updated
 @param {String} token - Stripe token for the vendor
 @return {Product} The updated product
 */
const updateProduct = async (data, product, token)=>{
    const stripe = stripePack(decrypt(token));
    const stripeData = {};
    if(data.name){
        product.name = data.name;
        stripeData.name = data.name;
    }

    if(data.tags) product.tags = data.tags;

    if(data.description) product.description = data.description;

    if(data.active !== undefined) product.active = data.active;

    if(Object.keys(stripeData).length > 0){
        await stripe.products.update(product.stripeId, stripeData);
    }

    return product;
}

/*
 Transform a product into the proper response format

 @param {Product} product - Product object
 @return {Object} Formatted product object
 */
const responseProduct = (product)=>{
    const productObj = {
        id: product._id,
        name: product.name,
        tags: product.tags,
        images: product.images,
        description: product.description,
        variations: []
    };

    for(let i = 0; i < product.variations.length; i++){
        productObj.variations.push({
            id: product.variations[i]._id,
            descriptor: product.variations[i].descriptor,
            price: product.variations[i].price,
            quantity: product.variations[i].quantity,
            shipping: product.variations[i].shipping,
            images: product.variations[i].images,
            purchaseOption: product.variations[i].purchaseOption
        })
    }

    return productObj;
}

export {
    createRoute,
    deleteRoute,
    getRoute,
    vendorGetRoute,
    getOneRoute,
    addImagesRoute,
    removeImagesRoute,
    updateRoute
};
