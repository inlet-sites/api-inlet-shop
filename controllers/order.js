import Order from "../models/order.js";
import Vendor from "../models/vendor.js";
import {Product} from "../models/product.js";

import validate from "../validation/order.js";
import stripePack from "stripe";

const createRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = await getVendor(req.body.vendor);
        const items = await getVariations(req.body.items);
        const subTotal = calculateSubTotal(items);
        const shipping = calculateShipping(items);
        const order = createOrder(vendor, items, subTotal, shipping);
        const paymentIntent = createPaymentIntent();
        await order.save();
        res.json({clientSecret: paymentIntent});
    }catch(e){next(e)}
}

/*
 Retrieve a vendor
 Throw error if vendor does not have good contact information

 @param {String} vendorId - ID of the vendor to retrieve
 @return {Vendor} Vendor object
 */
const getVendor = async (vendorId)=>{
    const vendor = await Vendor.findOne({_id: vendorId});
    if(!vendor.contact.phone && !vendor.contact.email){
        throw new CustomError(400, "Vendor has not provided contact information");
    }
    return vendor;
}

/*
 Create items list with full product and variation
 Validate the purchase of each product/variation

 @param {Object} items - Object containing product/variation IDs and purchase quantity
 @return {Object} Same as 'items', but with product/variation populated
 */
const getVariations = async (items)=>{
    const itemsList = [];
    for(let i = 0; i < items.length; i++){
        const product = await Product.findOne({_id: items[i].product});
        const variation = product.variations.find(v => v._id.toString() === items[i].variation);
        validateVariationPurchase(variation, items[i].quantity);
        itemsList.push({product, variation, quantity: items[i].quantity});
    }
    return itemsList;
}

/*
 Throw error if purchase is not valid on the variation

 @param {Variation} variation - Variation object
 @param {Number} purchaseQuantity - Amount to be purchased
 */
const validateVariationPurchase = (variation, purchaseQuantity)=>{
    if(purchaseQuantity > variation.quantity){
        throw new CustomError(400, `${variation._id}-Invalid quantity`);
    }
    if(variation.archived !== false) throw new CustomError(400, "Item not available for purchase");
    if(variation.purchaseOption !== "ship" || variation.purchaseOption !== "buy"){
        throw new CustomError(400, "Not available for online purchase");
    }
}

export {
    createRoute
}
