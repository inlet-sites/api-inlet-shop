import Vendor from "../models/vendor.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import sendEmail from "../sendEmail.js";
import {
    createPassRoute,
    changePassRoute,
    getTokenRoute,
    getSelfRoute,
    getVendorRoute,
    getAllVendorsRoute,
    updateRoute,
    changeImageRoute,

    confirmToken,
    passwordLength,
    passwordMatch,
    createPasswordHash,
    newToken,
    validPassword,
    createToken,
    createImage,
    removeImage,
    updateVendor,
    responseVendor
} from "../controllers/vendor.js";
import resetPasswordEmail from "../email/resetPassword.js";

const vendorRoutes = (app)=>{
    const getVendor = async (res, id)=>{
        let vendor;
        try{
            vendor = await Vendor.findOne({_id: id});
        }catch(e){
            console.error(e);
            httpError(res, 500, "Internal server error (err-001)");
            return null;
        }
        if(!vendor){
            httpError(res, 400, "Vendor with this ID doesn't exist");
            return null;
        }
        return vendor
    }

    app.put("/vendor/:vendorId/password/:token", createPassRoute);
    app.put("/vendor/:vendorId/password", vendorAuth, changePassRoute)
    app.post("/vendor/token", getTokenRoute);
    app.get("/vendor/self", vendorAuth, getSelfRoute);
    app.get("/vendor/:vendorUrl", getVendorRoute);
    app.get("/vendor", getAllVendorsRoute);
    app.put("/vendor", vendorAuth, updateRoute);
    app.put("/vendor/image", vendorAuth, changeImageRoute);

    app.post("/vendor/password/email", async (req, res)=>{
        const email = req.body.email.toLowerCase();
        let vendor;
        try{
            vendor = await Vendor.findOne({email: email});
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error, (err-015)");
        }
        if(!vendor){
            return httpError(res, 401, "User with this email doesn't exist");
        }

        sendEmail(
            vendor.email,
            vendor.name,
            "Password reset request",
            resetPasswordEmail(vendor.name, vendor._id, vendor.token)
        );

        res.json({success: true});
    });

    app.post("/vendor/password/reset", async (req, res)=>{
        let vendor = await getVendor(res, req.body.vendor);
        if(!vendor) return;

        if(!confirmToken(vendor, req.body.token)){
            return httpError(res, 400, "Invalid Authorization");
        }
        if(!passwordLength(req.body.password)){
            return httpError(res, 400, "Password must contain at least 10 characters");
        }
        if(!passwordMatch(req.body.password, req.body.confirmPassword)){
            return httpError(res, 400, "Passwords do not match");
        }

        vendor.password = await createPasswordHash(req.body.password);
        vendor.token = newToken();

        try{
            await vendor.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-016)");
        }

        res.json({success: true});
    });
}

export default vendorRoutes;
