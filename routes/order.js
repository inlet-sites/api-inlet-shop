import {
    createRoute,
    webhookRoute
} from "../controllers/order.js";

export default (app)=>{
    app.post("/order", createRoute);
    app.post("/order/webhook/:vendorId", webhookRoute);
}
