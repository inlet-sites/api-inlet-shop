import Vendor from "../models/vendor.js";

import {httpError} from "../error.js";
import {vendorAuth} from "../auth.js";
import {
    confirmToken,
    passwordLength,
    passwordMatch,
    createPasswordHash,
    newToken,
    validPassword,
    createToken,
    responseVendor
} from "../controllers/vendor.js";

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
            return httpError(res, 400, "Vendor with this ID doesn't exist");
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

    app.get("/vendor/:vendorId", vendorAuth, (req, res)=>{
        if(res.locals.vendor._id.toString() !== req.params.vendorId){
            return httpError(res, 401, "Unauthorized");
        }

        res.json(responseVendor(res.locals.vendor));
    });

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
}

export default vendorRoutes;
