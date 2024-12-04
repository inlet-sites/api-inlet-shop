import Variation from "../models/variation.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import validate from "../validation/variation.js";
import {
    createVariation,
    addImages,
    responseVariation
} from "../controllers/variation.js";

const variationRoutes = (app)=>{
    app.post("/variation", vendorAuth, async (req, res)=>{
        try{
            validate(req.body);
        }catch(e){
            return httpError(res, 400, e.message);
        }

        const variation = createVariation(req.body, Variation);
        variation.images = addImages(req.files);

        try{
            variation.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error");
        }

        res.json(responseVariation(variation));
    });
}

export default variationRoutes;
