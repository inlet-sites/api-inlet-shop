import Order from "../models/order.js";
import Vendor from "../models/vendor.js";
import {Product} from "../models/product.js";

import {CustomError} from "../CustomError.js";
import validate from "../validation/order.js";
import stripePack from "stripe";

const createRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = await getVendor(req.body.vendor);
        const items = await getVariations(req.body.items);
        const order = createOrder(vendor, items, req.body);
        const paymentIntent = await createPaymentIntent(vendor.stripeToken, order.total);
        order.paymentIntent = paymentIntent.id;
        updateQuantities(items);
        await order.save();
        res.json({clientSecret: paymentIntent.client_secret});
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
    if(variation.purchaseOption !== "ship" && variation.purchaseOption !== "buy"){
        throw new CustomError(400, "Not available for online purchase");
    }
}

/*
 Calculate total prices

 @param {Object} items - Items list of product/variation/quantity
 @return {Object} Object containing subTotal, shipping and total
 */
const calculateTotals = (items)=>{
    let subTotal = 0;
    let shipping = 0;
    for(let i = 0; i < items.length; i++){
        subTotal += items[i].variation.price * items[i].quantity;
        shipping += items[i].variation.shipping * items[i].quantity;
    }
    return {subTotal, shipping};
}

/*
 Create a new order object

 @param {Vendor} vendor - Vendor object
 @param {Object} Items - Items object with Product, Variation and quantity
 @param {object} data - Data from the request body
 @return {Order} Order object
 */
const createOrder = (vendor, items, data)=>{
    const {subTotal, shipping} = calculateTotals(items);
    const order = new Order({
        vendor: vendor._id,
        name: data.name,
        address: data.address,
        email: data.email.toLowerCase(),
        items: [],
        subTotal: subTotal,
        shipping: shipping,
        total: subTotal + shipping,
        status: "incomplete"
    });
    for(let i = 0; i < items.length; i++){
        order.items.push({
            product: items[i].product._id,
            variation: items[i].variation._id,
            quantity: items[i].quantity
        });
    }
    return order;
}

/*
 Update quantities on variations
 Save products to update database

 @param {Object} items - List containing Product, Variation and quantity
 */
const updateQuantities = (items)=>{
    for(let i = 0; i < items.length; i++){
        items[i].variation.quantity -= items[i].quantity;
        items[i].product.save();
    }
}

/*
 Create Stripe PaymentIntent

 @param {String} vendorId - ID of the vendor
 @param {Number} total - Total amount of payment in cents
 @return {PaymentIntent} Stripe PaymentIntent object
 */
const createPaymentIntent = async (vendorToken, total)=>{
    const stripe = stripePack(vendorToken);
    return  await stripe.paymentIntents.create({
        amount: total,
        currency: "usd"
    });
}

export {
    createRoute
}
