import {vendorAuth} from "../auth.js";
import {
    createVariation,
    removeVariation,
    addImagesRoute
} from "../controllers/variation.js";

const variationRoutes = (app)=>{
    app.post("/variation", vendorAuth, createVariation);
    app.delete("/product/:productId/variation/:variationId", vendorAuth, removeVariation);
    app.put("/product/:productId/variation/:variationId", vendorAuth, addImagesRoute);
}

export default variationRoutes;
