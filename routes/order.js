import {vendorAuth} from "../auth.js";

import {
    createRoute,
    webhookRoute,
    getOrderRoute,
    getOrdersRoute,
    getOrderVendorRoute
} from "../controllers/order.js";

export default (app)=>{
    app.post("/order", createRoute);
    app.post("/order/webhook/:vendorId", webhookRoute);
    app.get("/order/:orderId/token/:token", getOrderRoute);
    app.get("/order?*", vendorAuth, getOrdersRoute);
    app.get("/order/:orderId/vendor", vendorAuth, getOrderVendorRoute);
}
