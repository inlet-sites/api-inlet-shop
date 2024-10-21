import Product from "../models/product.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import {
    addImages
} from "../controllers/product.js";

const productRoutes = (app)=>{
    app.post("/product", vendorAuth, async (req, res)=>{
        const product = new Product({
            vendor: res.locals.vendor._id,
            name: req.body.name,
            tags: JSON.parse(req.body.tags),
            images: [],
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            hide: req.body.hide
        });

        product.images = await addImages(req.files.images);

        try{
            await product.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Unable to create new product (err-006)");
        }

        res.json(product);
    });
}

export default productRoutes;
