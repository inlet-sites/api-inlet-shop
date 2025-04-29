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
        if(e.message === "Cannot read properties of undefined (reading 'split')"){
            const error = new CustomError(400, "Must provide authorization token");
            catchError(error, req, res, next);
            return;
        }

        if(e.message === "jwt malformed"){
            const error = new CustomError(400, "Invalid JWT");
            catchError(error, req, res, next);
            return;
        }

        catchError(e, req, res, next);
    }
}

export {vendorAuth};
