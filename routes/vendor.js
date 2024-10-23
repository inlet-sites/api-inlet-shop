import Vendor from "../models/vendor.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import sendEmail from "../sendEmail.js";
import {
    confirmToken,
    passwordLength,
    passwordMatch,
    createPasswordHash,
    newToken,
    validPassword,
    createToken,
    createImage,
    removeImage,
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

    app.put("/vendor/:vendorId/password/:token", async (req, res)=>{
        let vendor = await getVendor(res, req.params.vendorId);
        if(!vendor) return;

        if(!confirmToken(vendor, req.params.token)) return httpError(res, 400, "Invalid Authorization");
        if(!passwordLength(req.body.password)) return httpError(res, 400, "Password must contain at least 10 characters");
        if(!passwordMatch(req.body.password, req.body.confirmPassword)) return httpError(res, 400, "Passwords do not match");

        vendor.password = await createPasswordHash(req.body.password);
        vendor.token = newToken();
        try{
            await vendor.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-002)");
        }

        res.json({sucess: true});
    });

    app.put("/vendor/:vendorId/password", vendorAuth, async (req, res)=>{
        if(!passwordLength(req.body.password)){
            return httpError(res, 400, "Password must contain at least 10 characters");
        }

        if(!passwordMatch(req.body.password, req.body.confirmPassword)){
            return httpError(res, 400, "Passwords do not match");
        }

        res.locals.vendor.password = await createPasswordHash(req.body.password);
        res.locals.vendor.token = newToken();

        try{
            await res.locals.vendor.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-014)");
        }

        res.json({success: true});
    });

    app.post("/vendor/token", async (req, res)=>{
        const email = req.body.email.toLowerCase();
        let vendor;
        try{
            vendor = await Vendor.findOne({email: email});
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-003)");
        }
        if(!vendor) return httpError(res, 400, "Invalid credentials");

        const valid = await validPassword(req.body.password, vendor.password);
        if(!valid) return httpError(res, 400, "Invalid credentials");

        const token = createToken(vendor);
        res.json({token: token});
    });

    app.get("/vendor/self", vendorAuth, (req, res)=>{
        res.locals.vendor.password = undefined;
        res.locals.vendor.token = undefined;
        res.json(res.locals.vendor);
    });

    app.get("/vendor/:vendorId", async (req, res)=>{
        const vendor = await getVendor(res, req.params.vendorId);
        if(!vendor) return;

        res.json(responseVendor(vendor));
    })

    app.get("/vendor", async (req, res)=>{
        let vendors;
        try{
            vendors = await Vendor.find({}, {
                store: 1,
                image: 1
            });
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-004)");
        }

        res.json(vendors);
    });

    app.put("/vendor/image", vendorAuth, async (req, res)=>{
        let file;
        try{
            file = await createImage(req.files.file);
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-005)");
        }

        if(res.locals.vendor.image) removeImage(res.locals.vendor.image);

        res.locals.vendor.image = file;
        try{
            await res.locals.vendor.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Unable to save image");
        }

        res.locals.vendor.password = undefined;
        res.locals.vendor.token = undefined;
        res.json(res.locals.vendor);
    });


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
}

export default vendorRoutes;
