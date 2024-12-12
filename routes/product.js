import {Product} from "../models/product.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import validate from "../validation/product.js";
import {
    createRoute,
    deleteRoute,
    getRoute,

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

    app.get("/product/vendor", vendorAuth, async (req, res)=>{
        let products;
        try{
            products = await Product.aggregate([
                {$match: {
                    vendor: res.locals.vendor._id,
                    archived: false
                }},
                {$project: {
                    _id: 0,
                    id: "$_id",
                    name: 1,
                    tags: 1,
                    images: 1,
                    active: 1
                }}
            ]);
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-010)");
        }

        res.json(products);
    });

    app.get("/product/:productId", async (req, res)=>{
        let product;
        try{
            product = await Product.aggregate([
                {$match: {
                    _id: new ObjectId(req.params.productId),
                    archived: false
                }},
                {$lookup: {
                    from: "variations",
                    localField: "variations",
                    foreignField: "_id",
                    as: "variations"
                }},
                {$project: {
                    archived: 0,
                    stripeId: 0,
                    "variations.product": 0,
                    "variations.priceId": 0
                }}
            ]);
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error");
        }
        if(!product) return httpError(res, 400, "No product with that ID");

        product = product[0];
        product.id = product._id;
        product._id = undefined;

        res.json(product);
    });

    app.put("/product/:productId/images/add", vendorAuth, async (req, res)=>{
        //Get product and verify it is owned by authorized vendor
        const product = await getProduct(res, req.params.productId);
        if(!product) return;
        if(product.vendor.toString() !== res.locals.vendor._id.toString()){
            return httpError(res, 403, "Forbidden");
        }

        //Find correct images list to add the images
        product.images = product.images.concat(await addImages(req.files.images));

        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-011)");
        }

        res.json(responseProduct(product));
    });

    app.put("/product/:productId/images/remove", vendorAuth, async (req, res)=>{
        let product = await getProduct(res, req.params.productId);
        if(!product) return;
        if(product.vendor.toString() !== res.locals.vendor._id.toString()){
            return httpError(res, 403, "Forbidden");
        }

        product = removeImages(req.body.images, product);

        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-012)");
        }

        res.json(responseProduct(product));
    });

    app.put("/product/:productId", vendorAuth, async (req, res)=>{
        try{
            validate(req.body);
        }catch(e){
            return httpError(res, 400, e.message);
        }

        //Retrieve the product 
        let product = await getProduct(res, req.params.productId);
        if(!product) return;
        if(product.vendor.toString() !== res.locals.vendor._id.toString()){
            return httpError(res, 403, "Forbidden");
        }

        try{
            product = await updateProduct(req.body, product, res.locals.vendor.stripeToken);
        }catch(e){
            return httpError(res, 400, e.message);
        }

        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-013)");
        }

        res.json(responseProduct(product));
    });
}

export default productRoutes;
