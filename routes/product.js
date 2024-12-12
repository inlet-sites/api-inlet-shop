import {Product} from "../models/product.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import validate from "../validation/product.js";
import {
    createRoute,
    deleteRoute,
    getRoute,
    vendorGetRoute,
    getOneRoute,
    addImagesRoute,
    removeImagesRoute,
    updateRoute,

    addImages,
    removeImages,
    createStripeProduct,
    archiveStripeProduct,
    updateProduct,
    responseProduct
} from "../controllers/product.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

const productRoutes = (app)=>{
    const getProduct = async (res, id)=>{
        let product;
        try{
            product = await Product.findOne({_id: id});
        }catch(e){
            console.error(e);
            httpError(res, 500, "Internal server error (err-007)");
            return null;
        }
        if(!product){
            httpError(res, 400, "Product with this ID doesn't exist");
            return null;
        }
        return product;
    }

    app.post("/product", vendorAuth, createRoute);
    app.delete("/product/:productId", vendorAuth, deleteRoute);
    app.get("/product/vendor/:vendorId", getRoute);
    app.get("/product/vendor", vendorAuth, vendorGetRoute);
    app.get("/product/:productId", getOneRoute);
    app.put("/product/:productId/images/add", vendorAuth, addImagesRoute);
    app.put("/product/:productId/images/remove", vendorAuth, removeImagesRoute);
    app.put("/product/:productId", vendorAuth, updateRoute);
}

export default productRoutes;
