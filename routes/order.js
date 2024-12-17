import {
    createRoute
} from "../controllers/order.js";

export default (app)=>{
    app.post("/order", createRoute);
}
