import {vendorAuth} from "../auth.js";
import {
    createPassRoute,
    changePassRoute,
    getTokenRoute,
    getSelfRoute,
    getVendorRoute,
    getAllVendorsRoute,
    updateRoute,
    changeImageRoute,
    passwordEmailRoute,
    resetPasswordRoute,
    createConnectRoute
} from "../controllers/vendor.js";

const vendorRoutes = (app)=>{
    app.put("/vendor/:vendorId/password/:token", createPassRoute);
    app.put("/vendor/:vendorId/password", vendorAuth, changePassRoute)
    app.post("/vendor/token", getTokenRoute);
    app.get("/vendor/self", vendorAuth, getSelfRoute);
    app.get("/vendor/:vendorUrl", getVendorRoute);
    app.get("/vendor", getAllVendorsRoute);
    app.put("/vendor", vendorAuth, updateRoute);
    app.put("/vendor/image", vendorAuth, changeImageRoute);
    app.post("/vendor/password/email", passwordEmailRoute);
    app.post("/vendor/password/reset", resetPasswordRoute);
    app.post("/vendor/connect", vendorAuth, createConnectRoute);
}

export default vendorRoutes;
