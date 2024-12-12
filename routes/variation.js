import {vendorAuth} from "../auth.js";
import {
    createVariation,
    removeVariation
} from "../controllers/variation.js";

const variationRoutes = (app)=>{
    app.post("/variation", vendorAuth, createVariation);
    app.delete("/product/:productId/variation/:variationId", vendorAuth, removeVariation);
}

export default variationRoutes;
