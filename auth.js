import Vendor from "./models/vendor.js";

import {CustomError, catchError} from "./CustomError.js";
import jwt from "jsonwebtoken";

const vendorAuth = async (req, res, next)=>{
    try{
        const [bearer, token] = req.headers.authorization.split(" ");
        if(bearer !== "Bearer") throw new CustomError(401, "Unauthorized");
        const vendorData = jwt.verify(token, process.env.JWT_SECRET);

        const vendor = await Vendor.findOne({_id: vendorData.id});
        if(!vendor || vendor.token !== vendorData.token){
            throw new CustomError(401, "Unauthorized");
        }
        if(vendor.active === false){
            throw new CustomError(401, "Account Suspended");
        }

        res.locals.vendor = vendor;
        next();
    }catch(e){
        catchError(e, req, res, next);
    }
}

export {vendorAuth};
