import Order from "../models/order.js";
import Vendor from "../models/vendor.js";
import {Product} from "../models/product.js";

import {CustomError} from "../CustomError.js";
import sendEmail from "../sendEmail.js";
import validate from "../validation/order.js";
import {decrypt, newUUID} from "../crypto.js";
import stripePack from "stripe";
import mongoose from "mongoose";

import paymentSucceededEmail from "../email/paymentSucceeded.js";
import paymentFailedEmail from "../email/paymentFailed.js";
import orderCanceledEmail from "../email/orderCanceled.js";

const stripe = stripePack(process.env.STRIPE_INLETSITES_KEY);

const createRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = await getVendor(req.body.vendor);
        const items = await getVariations(req.body.items);
        const order = createOrder(vendor, items, req.body);
        const paymentIntent = await createPaymentIntent(vendor.stripe.accountId, order.total);
        order.paymentIntent = paymentIntent.id;
        updateQuantities(items);
        await order.save();
        res.json({
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE,
            orderId: order._id,
            orderToken: order.uuid,
            connectedId: vendor.stripe.accountId
        });
    }catch(e){next(e)}
}

const webhookRoute = async (req, res, next)=>{
    try{
        const vendor = await getVendor(req.params.vendorId);
        const event = stripe.webhooks.constructEvent(
            req.body,
            req.headers["stripe-signature"],
            "whsec_a6d6b1ca9986ccb08a714318705749a4869cb5f389793287116d77e290af1939"
        );
        handleEvent(event);
        res.send();
    }catch(e){next(e)}
}

const getOrderRoute = async (req, res, next)=>{
    try{
        const order = await getFullOrder(req.params.orderId);
        verifyOrderUUID(order, req.params.token);
        order.uuid = undefined;
        res.json(order);
    }catch(e){next(e)}
}

const getOrdersRoute = async (req, res, next)=>{
    try{
        validate(req.query);
        const {status, from, to} = getSearchQueryData(req.query);
        const orders = await searchOrders(
            res.locals.vendor._id,
            from,
            to,
            status
        );
        res.json(orders);
    }catch(e){next(e)}
}

const getOrderVendorRoute = async (req, res, next)=>{
    try{
        const order = await getFullOrder(req.params.orderId);
        verifyOwnership(res.locals.vendor, order);
        order.uuid = undefined;
        res.json(order);
    }catch(e){next(e)}
}

const updateOrderRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        let order = await getSingleOrder(req.params.orderId);
        verifyOwnership2(res.locals.vendor, order);
        order = updateOrder(order, req.body);
        await order.save();
        if(req.body.status === "declined"){
            sendEmail(
                order.email,
                order.name,
                "Your order has been declined",
                orderCanceledEmail(order._id, order.uuid, req.body.note)
            );
        }
        order = await getFullOrder(req.params.orderId);
        res.json(order);
    }catch(e){next(e)}
}

/*
 Retrieve a single order with the order ID

 @param {String} orderId - ID of the order to retrieve
 @return {Order} Order object
 */
const getSingleOrder = async (orderId)=>{
    return await Order.findOne({_id: orderId});
}

/*
 Retrieve a vendor
 Throw error if vendor does not have good contact information

 @param {String} vendorId - ID of the vendor to retrieve
 @return {Vendor} Vendor object
 */
const getVendor = async (vendorId)=>{
    const vendor = await Vendor.findOne({_id: vendorId});
    if(!vendor) trhow new CustomError(400, "No vendor with that ID");
    return vendor;
}

const getVendorByConnectId = async (id)=>{
    const vendor = await Vendor.findOne({"stripe.accountId": id});
    if(!vendor) throw new CustomError(400, "Vendor not found");
    return vendor;
}

/*
 Throw error if token does not match UUID

 @param {Order} order - Order object
 @param {String} uuid - UUID from the query
 */
const verifyOrderUUID = (order, uuid)=>{
    if(order.uuid !== uuid) throw new CustomError(403, "Forbidden");
}

/*
 Throw error if vendor does not own the order

 @param {Vendor} vendor - Vendor object
 @param {Order} order - Order object
 */
const verifyOwnership = (vendor, order)=>{
    if(vendor._id.toString() !== order.vendor[0]._id.toString()){
        throw new CustomError(403, "Forbidden");
    }
}

/*
 Throw error if vendor does not own the order
 This function assumes vendor is an ObjectId and has not been populated
 */
const verifyOwnership2 = (vendor, order)=>{
    if(vendor._id.toString() !== order.vendor.toString()){
        throw new CustomError(403, "Forbidden");
    }
}

/*
 Update data on an order
 
 @param {Order} order - Order object
 @param {String} data.status - String representing the new status
 @return {Order} Order object
 */
const updateOrder = (order, data)=>{
    if(data.status) order.status = data.status;

    return order;
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
        throw new CustomError(400, `${variation.descriptor} - ${variation.quantity} available`);
    }
    if(variation.archived !== false) throw new CustomError(400, `${variation.descriptor} no longer available`);
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
        uuid: newUUID(),
        items: [],
        subTotal: subTotal,
        shipping: shipping,
        total: subTotal + shipping,
        status: "incomplete",
        date: new Date()
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
const createPaymentIntent = async (connectedId, total)=>{
    return await stripe.paymentIntents.create(
        {
            amount: total,
            currency: "usd",
            automatic_payment_methods: {enabled: true},
            application_fee_amount: Math.floor(total * 0.01)
        },
        {stripeAccount: connectedId}
    );
}

/*
 Take in an event and pass it off to the correct function

 @param {Event} event - Stripe Event object
 */
const handleEvent = (event)=>{
    switch(event.type){
        case "payment_intent.succeeded":
            handleSuccessEvent(event.data.object.id, event.account);
            break;
        case "payment_intent.canceled":
            handleFailedEvent(event.data.object.id, event.account);
            break;
        case "payment_intent.payment_failed":
            handleFailedEvent(event.data.object.id, event.account);
            break;
    }
}

/*
 Update order status and send email to customer once payment succeeds

 @param {String} paymentIntentId - Id of the paymentIntent
 */
const handleSuccessEvent = async (paymentIntentId, connectId)=>{
    try{
        const vendor = await getVendorByConnectId(connectId);
        const order = await getOrderByPaymentIntent(paymentIntentId);
        order.status = "paid";
        sendEmail(
            order.email,
            order.name,
            `Your purchase at ${vendor.store}`,
            paymentSucceededEmail(order, vendor)
        );
        order.save();
    }catch(e){
        console.error(e);
    }
}

/*
 Update order status and send email to customer if payment fails

 @param {String} paymentIntentId - Id of the PaymentIntent
 */
const handleFailedEvent = async (paymentIntentId, connectId)=>{
    try{
        const vendor = await getVendorByConnectId(connectId);
        const order = await getOrderByPaymentIntent(paymentIntentId);
        order.status = "paymentFailed";
        sendEmail(
            order.email,
            order.name,
            `Failed payment at ${vendor.store}`,
            paymentFailedEmail(order, vendor)
        );
        order.save();
    }catch(e){
        console.error(e);
    }
}

/*
 Retrieve a single order from the ID

 @param {String} orderId - ID of the order to retrieve
 @return {Order} Order object
 */
const getFullOrder = async (orderId)=>{
    const order = await Order.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(orderId)}},
        {$lookup: {
            from: "vendors",
            localField: "vendor",
            foreignField: "_id",
            as: "vendor",
            pipeline: [{$project: {
                store: 1,
                url: 1,
                image: 1,
                slogan: 1,
                contact: 1
            }}]
        }},
        {$unwind: "$items"},
        {$lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productDetails",
            pipeline: [{$project: {
                id: "$_id",
                _id: 0,
                name: 1,
                tags: 1,
                images: 1,
                description: 1,
                variations: {
                    $map: {
                        input: "$variations",
                        as: "variation",
                        in: {
                            id: "$$variation._id",
                            descriptor: "$$variation.descriptor",
                            price: "$$variation.price",
                            shipping: "$$variation.shipping",
                            purchaseOption: "$$variation.purchaseOption",
                            images: "$$variation.images"
                        }
                    }
                }
            }}]
        }},
        {$unwind: "$productDetails"},
        {$addFields: {"items.product": "$productDetails"}},
        {$group: {
            _id: "$_id",
            items: {$push: "$items"},
            vendor: {$first: "$vendor"},
            name: {$first: "$name"},
            address: {$first: "$address"},
            email: {$first: "$email"},
            subTotal: {$first: "$subTotal"},
            shipping: {$first: "$shipping"},
            total: {$first: "$total"},
            status: {$first: "$status"},
            date: {$first: "$date"},
            uuid: {$first: "$uuid"}
        }}
    ]);
    if(order.length === 0) throw new CustomError(400, "Order with that ID doesn't exist");
    return order[0];
}

/*
 Retrieve order from database based on Stripe PaymentIntent
 
 @param {String} paymentIntentId - ID of Stripe PaymentIntent
 @return {Order} - Order object
 */
const getOrderByPaymentIntent = async (paymentIntentId)=>{
    const order = await Order.findOne({paymentIntent: paymentIntentId});
    if(!order){
        const error = {
            error: {
                paymentIntent: paymentIntentId,
                message: "Order not found"
            }
        };
        throw new Error(error);
    }
    return order;
}

/*
 Format data from search query into appropriate data for the search

 @param {Object} data - Strings including, status, from, or to
 @return {Object} Similar object with formatted data
 */
const getSearchQueryData = (data)=>{
    return{
        status: data.status ? data.status.split(",") : undefined,
        from: data.from ? new Date(data.from) : undefined,
        to: data.to ? new Date(data.to) : undefined
    };
}

const searchOrders = async (vendorId, from, to, status)=>{
    const match = {$match: {
        vendor: vendorId,
    }};
    if(from || to) match.$match.date = {};
    if(from) match.$match.date.$gte = from;
    if(to) match.$match.date.$lt = to;
    if(status) match.$match.status = {$in: status};

    return await Order.aggregate([
        match,
        {$sort: {date: -1}},
        {$project: {
            id: "$_id",
            _id: 0,
            name: 1,
            address: 1,
            email: 1,
            items: 1,
            subTotal: 1,
            shipping: 1,
            total: 1,
            status: 1
        }}
    ]);
}

export {
    createRoute,
    webhookRoute,
    getOrderRoute,
    getOrdersRoute,
    getOrderVendorRoute,
    updateOrderRoute
}
