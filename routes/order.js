import {vendorAuth} from "../auth.js";
import rawBody from "../rawBody.js";

import {
    createRoute,
    webhookRoute,
    getOrderRoute,
    getOrdersRoute,
    getOrderVendorRoute,
    updateOrderRoute
} from "../controllers/order.js";

export default (app)=>{
    app.post("/order", createRoute);
    app.post("/order/webhook/:vendorId", rawBody, webhookRoute);
    app.get("/order/:orderId/token/:token", getOrderRoute);
    app.get("/order/:orderId/vendor", vendorAuth, getOrderVendorRoute);
    app.get("/order?*", vendorAuth, getOrdersRoute);
    app.put("/order/:orderId", vendorAuth, updateOrderRoute);
}
