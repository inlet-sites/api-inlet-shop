import Order from "../models/order.js";

import validate from "../validation/order.js";
import stripePack from "stripe";

const createRoute = (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = getVendor(req.body.vendor); //verify contact information
        const items = getVariations(items); //verify quantity
        const subTotal = calculateSubTotal(items);
        const shipping = calculateShipping(items);
        const order = createOrder(vendor, items, subTotal, shipping);
        const paymentIntent = createPaymentIntent();
        await order.save();
        res.json({clientSecret: paymentIntent});
    }catch(e){next(e)}
}

export {
    createRoute
}
