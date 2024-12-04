import Variation from "../models/variation.js";
import Product from "../models/product.js";

import {CustomError} from "../CustomError.js";
import validate from "../validation/variation.js";
import stripePack from "stripe";

const createVariation = async (req, res)=>{
    try{
        validate(req.body);
        const product = await getProduct(req.body.product, res.locals.vendor._id.toString());
        const variation = await newVariation(
            req.body,
            product._id.toString(),
            Boolean(res.locals.vendor.stripeToken)
        );
        variation.images = addImages(req.files);
        await variation.save();
        res.json(responseVariation(variation));
    }catch(e){
        throw e;
    }
}

/*
 Retrieve product
 If vendor ID is also passed, verify ownership

 @param {String ID} productId - ID of the product to retrieve
 @param {String ID (optional)} vendorId - If, provided, verifies vendor ownership of product
 @return {Product} The retrieved product
 */
const getProduct = async (productId, vendorId)=>{
    let product;
    try{
        product = await Product.findOne({_id: productId});
    }catch(e){
        throw e;
    }
    if(!product) throw new CustomError(400, "No product with that ID");
    if(product.vendor.toString() !== vendorId){
        throw new CustomError(403, "Forbidden");
    }
}

/*
 Creates a new Variation object with only necessary data

 @param {Object} data - All body data from request
 @param {String ID} productId - Product ID that the variation belongs to
 @param {String} stripeToken - Stripe token of user, if any
 @return {Variation} Newly created variation
 */
const newVariation = async (data, productId, stripeToken)=>{
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
        variation.priceId = await createPrice(stripeToken, data.price, productId);
    }

    return variation;
}

const createPrice = async (token, amount, product)=>{
    const stripe = stripePack(token);

    let price;
    try{
        price = await stripe.prices.create({
            currency: "usd",
            unit_amount: price,
            product: product
        });
    }catch(e){
        throw e;
    }

    return price.id;
}

const addImages = (files)=>{
    return null;
}

const responseVariation = (variation)=>{
    return null;
}

export {
    createVariation,
    addImages,
    responseVariation
};
