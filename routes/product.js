import Product from "../models/product.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import validate from "../validation/product.js";
import {
    createVariations,
    validatePurchaseOption,
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

    app.post("/product", vendorAuth, async (req, res)=>{
        let data;
        try{
            data = {
                ...req.body,
                tags: JSON.parse(req.body.tags),
                active: req.body.active === "true" ? true : false
            };

            validate(data);
        }catch(e){
            return httpError(res, 400, e.message);
        }

        const product = new Product({
            vendor: res.locals.vendor._id,
            name: data.name,
            tags: data.tags,
            images: [],
            description: data.description,
            variations: [],
            active: data.active,
            archived: false,
        });

        if(res.locals.vendor.stripeToken){
            product.stripeId = await createStripeProduct(
                res.locals.vendor.stripeToken,
                product.name,
                product.active
            );
        }

        if(req.files) product.images = await addImages(req.files.images);

        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Unable to create new product (err-006)");
        }

        res.json(responseProduct(product));
    });

    app.delete("/product/:productId", vendorAuth, async (req, res)=>{
        let product = await getProduct(res, req.params.productId);
        if(!product) return;

        if(!res.locals.vendor._id.toString() === product.vendor.toString()){
            return httpError(res, 403, "Forbidden");
        }
        
        //Add all product images to an array to later remove from server
        let images = [];
        images = images.concat(product.images);
        product.images = [];
        for(let i = 0; i < product.variations.length; i++){
            images = images.concat(product.variations[i].images);
            product.variations[i].images = [];
        }

        product.archived = true;
        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-008)")
        }

        removeImages(images);
        archiveStripeProduct(res.locals.vendor.stripeToken, product.stripeId);

        res.json({success: true});
    });

    app.get("/product/vendor/:vendorId", async (req, res)=>{
        let products;
        try{
            products = await Product.aggregate([
                {$match: {
                    vendor: new ObjectId(req.params.vendorId),
                    active: true,
                    archived: false
                }},
                {$lookup: {
                    from: "variations",
                    localField: "variations",
                    foreignField: "_id",
                    as: "variations"
                }},
                {$project: {
                    vendor: 0,
                    active: 0,
                    archived: 0,
                    stripeId: 0,
                    "variations.product": 0,
                    "variations.priceId": 0
                }}
            ]);
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-009)");
        }

        res.json(products);
    });

    app.get("/product/vendor", vendorAuth, async (req, res)=>{
        let products;
        try{
            products = await Product.aggregate([
                {$match: {
                    vendor: res.locals.vendor._id,
                    archived: false
                }},
                {$project: {
                    id: "$_id",
                    name: 1,
                    images: 1,
                    price: 1,
                    quantity: 1,
                    active: 1,
                    tags: 1
                }}
            ]);
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-010)");
        }

        res.json(products);
    });

    app.get("/product/:productId", async (req, res)=>{
        const product = await getProduct(res, req.params.productId);
        if(!product) return;

        res.json(responseProduct(product));
    });

    app.put("/product/:productId/images/add", vendorAuth, async (req, res)=>{
        //Get product and verify it is owned by authorized vendor
        const product = await getProduct(res, req.params.productId);
        if(!product) return httpError(res, 400, "No product with this ID");
        if(product.vendor.toString() !== res.locals.vendor._id.toString()){
            return httpError(res, 403, "Forbidden");
        }

        //Find correct images list to add the images
        const newImages = await addImages(req.files.images);
        if(req.body.variation === "none"){
            product.images = product.images.concat(newImages);
        }else{
            for(let i = 0; i < product.variations.length; i++){
                if(product.variations[i]._id.toString() === req.body.variation){
                    product.variations[i].images = product.variations[i].images.concat(newImages);
                }
            }
        }

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

        product = removeImages(req.body.images, product, req.body.variation);

        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-012)");
        }

        res.json(responseProduct(product));
    });

    app.put("/product/:productId", vendorAuth, async (req, res)=>{
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
