import {vendorAuth} from "../auth.js";
import {
    createRoute,
    deleteRoute,
    getRoute,
    vendorGetRoute,
    getOneRoute,
    addImagesRoute,
    removeImagesRoute,
    updateRoute,
} from "../controllers/product.js";

const productRoutes = (app)=>{
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
