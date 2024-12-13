import {Product, Variation} from "../models/product.js";

import {CustomError} from "../CustomError.js";
import validate from "../validation/variation.js";
import stripePack from "stripe";
import sharp from "sharp";
import crypto from "crypto";

const createVariation = async (req, res, next)=>{
    try{
        validate(req.body);
        const product = await getProduct(req.body.product);
        validateOwnership(product, res.locals.vendor._id.toString());
        const variation = await newVariation(
            req.body,
            product._id.toString(),
            product.stripeId,
            res.locals.vendor.stripeToken
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
        const variation = archiveVariation(product, req.params.variationId);
        setStripePriceInactive(res.locals.vendor.stripeToken, variation.priceId);
        await product.save();
        res.json({success: true});
    }catch(e){next(e)}
}

const addImagesRoute = async (req, res, next)=>{
    try{
        const product = await getProduct(req.params.productId);
        validateOwnership(product, res.locals.vendor._id.toString());
        const variation = archiveVariation(product, req.params.variationId);
        variation.images = variation.images.concat(addImages(req.files.images));
        await product.save();
        res.json(variation);
    }catch(e){next(e)}
}

/*
 Retrieve product
 If vendor ID is also passed, verify ownership

 @param {String ID} productId - ID of the product to retrieve
 @param {String ID (optional)} vendorId - If, provided, verifies vendor ownership of product
 @return {Product} The retrieved product
 */
const getProduct = async (productId, vendorId)=>{
    const product = await Product.findOne({_id: productId});
    if(!product) throw new CustomError(400, "No product with that ID");
    return product;
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
 Set the corresponding Stripe price as inactive

 @param {String} vendorToken - Stripe token of the vendor
 @param {String} priceToken - Stripe token for the price
 */
const setStripePriceInactive = (vendorToken, priceToken)=>{
    const stripe = stripePack(vendorToken);
    stripe.prices.update(priceToken, {active: false});
}

/*
 Creates a new Variation object with only necessary data

 @param {Object} data - All body data from request
 @param {String ID} productId - Product ID that the variation belongs to
 @param {String} stripeToken - Stripe token of user, if any
 @return {Variation} Newly created variation
 */
const newVariation = async (data, productId, stripeProductId, stripeToken)=>{
    const variation = new Variation({
        product: productId,
        descriptor: data.descriptor,
        price: data.price,
        quantity: data.quantity,
        shipping: data.shipping,
        images: [],
        purchaseOption: stripeToken ? data.purchaseOption : "list",
        archived: false
    });

    if(stripeToken){
        variation.priceId = await createPrice(stripeToken, data.price, stripeProductId);
    }

    return variation;
}

/*
 Create a Stripe price on the product

 @param {String} token - Vendor's stripe token
 @param {Number} amount - Price of the variation
 @param {String} product - Product ID to add this price to
 @return {String} ID of the newly create Stripe price
 */
const createPrice = async (token, amount, product)=>{
    const stripe = stripePack(token);

    const price = await stripe.prices.create({
        currency: "usd",
        unit_amount: amount,
        product: product
    });

    return price.id;
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
        const uuid = crypto.randomUUID();
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
 Create the data to be returned to user/vendor from the full Variation

 @param {Variation} variation - Full Variation object
 @return {Object} Object containing data to use in the response
 */
const responseVariation = (variation)=>{
    return {
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
    addImagesRoute
};
