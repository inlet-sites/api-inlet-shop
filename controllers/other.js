import Vendor from "../models/vendor.js";
import {Product} from "../models/product.js";

import mongoose from "mongoose";

const getDocumentRoute = (req, res, next)=>{
    try{
        res.sendFile(`${global.cwd}/documents/${req.params.document}`);
    }catch(e){next(e)}
}

const getCartRoute = async (req, res, next)=>{
    try{
        let cart = await getVendors(req.body);
        cart = await populateProducts(cart, req.body);
        cart = formatVariations(cart);
        res.json(cart);
    }catch(e){next(e)}
}

/*
 Get list of all relevant vendors with added array for items

 @param {Array} cart - Full cart object
 @return {[Vendor]} List of vendors
 */
const getVendors = async (cart)=>{
    const vendorIds = Object.keys(cart);
    return await Vendor.find({_id: vendorIds}, {
        store: 1,
        url: 1
    }).lean();
}

/*
 For each item on vendors, populate the products

 @param {[Vendor]} vendors - List of vendor objects
 @param {Object} cartObj - Original cart object
 @return {[Vendors]} Same vendors list, but with products populated
 */
const populateProducts = async (vendors, cartObj)=>{
    for(let i = 0; i < vendors.length; i++){
        vendors[i].items = [];
        const items = cartObj[vendors[i]._id.toString()];
        vendors[i].cart = items;
        for(let j = 0; j < items.length; j++){
            vendors[i].items.push({
                product: await Product.findOne({_id: items[j].product}),
                variation: items[j].variation,
                quantity: items[j].quantity
            });
        }
    }

    return vendors;
}

/*
 Remove all variations from products
 Specific variation required is saved alongside product

 @param {Cart} cart - Fully populated cart
 @return {Cart} Cart with updated data
 */
const formatVariations = (cart)=>{
    for(let i = 0; i < cart.length; i++){
        for(let j = 0; j < cart[i].items.length; j++){
            for(let k = 0; k < cart[i].items[j].product.variations.length; k++){
                const variation = cart[i].items[j].product.variations[k];
                if(variation._id.toString() === cart[i].items[j].variation){
                    cart[i].items[j].variation = variation;
                    cart[i].items[j].product.variations = undefined;
                    break;
                }
            }
        }
    }

    return cart;
}

export {
    getDocumentRoute,
    getCartRoute
}
