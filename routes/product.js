import Product from "../models/product.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import {
    addImages,
    createStripeProduct
} from "../controllers/product.js";

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
        const product = new Product({
            vendor: res.locals.vendor._id,
            name: req.body.name,
            tags: JSON.parse(req.body.tags),
            images: [],
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            active: req.body.active,
            archived: false
        });
        product.stripeId = await createStripeProduct(
            res.locals.vendor.stripeToken,
            product.name,
            product.active,
            product.description,
            product.price
        );

        product.images = await addImages(req.files.images);

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

        product.archived = true;
        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-008)")
        }

        res.json({success: true});
    });
}

export default productRoutes;
