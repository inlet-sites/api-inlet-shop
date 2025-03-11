import {vendorAuth} from "../auth.js";
import express from "express";

import {
    createRoute,
    webhookRoute,
    getOrderRoute,
    getOrdersRoute,
    getOrderVendorRoute,
    updateOrderRoute
} from "../controllers/order.js";

export default (app)=>{
    app.post("/order", express.json(), createRoute);
    app.post("/order/webhook", express.raw({type: "application/json"}), webhookRoute);
    app.get("/order/:orderId/token/:token", express.json(), getOrderRoute);
    app.get("/order/:orderId/vendor", express.json(), vendorAuth, getOrderVendorRoute);
    app.get("/order?*", express.json(), vendorAuth, getOrdersRoute);
    app.put("/order/:orderId", express.json(), vendorAuth, updateOrderRoute);
}
