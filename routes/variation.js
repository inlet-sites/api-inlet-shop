import {vendorAuth} from "../auth.js";
import {
    createVariation
} from "../controllers/variation.js";

const variationRoutes = (app)=>{
    app.post("/variation", vendorAuth, createVariation);
}

export default variationRoutes;
