import {vendorAuth} from "../auth.js";
import {
    createVariation,
    removeVariation,
    addImagesRoute,
    removeImagesRoute
} from "../controllers/variation.js";

const variationRoutes = (app)=>{
    app.post("/variation", vendorAuth, createVariation);
    app.delete("/product/:productId/variation/:variationId", vendorAuth, removeVariation);
    app.put("/product/:productId/variation/:variationId/images/add", vendorAuth, addImagesRoute);
    app.put("/product/:productId/variation/:variationId/images/remove", vendorAuth, removeImagesRoute);
}

export default variationRoutes;
