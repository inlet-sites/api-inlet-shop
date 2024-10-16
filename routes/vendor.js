import Vendor from "../models/vendor.js";

import {httpError} from "../error.js";
import {
    confirmToken,
    passwordLength,
    passwordMatch,
    createPasswordHash,
    newToken
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
        console.log(vendor.token);
        try{
            await vendor.save();
        }catch(e){
            console.error(e);
            return httpError(res, 500, "Internal server error (err-002)");
        }

        res.json({sucess: true});
    });
}

export default vendorRoutes;
