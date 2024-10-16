const Vendor = require("./models/vendor.js");

const jwt = require("jsonwebtoken");
const {httpError} = require("./error.js");

const vendorAuth = async (req, res, next)=>{
    let vendorData;
    try{
        const [bearer, token] = req.headers.authorization.split(" ");
        if(bearer !== "Bearer") return httpError(res, 401, "Unauthorized");
        vendorData = jwt.verify(token, process.env.JWT_SECRET);
    }catch(e){
        return httpError(res, 401, "Unauthorized");
    }

    let vendor;
    try{
        vendor = await Vendor.findOne({_id: vendorData.id});
    }catch(e){
        return httpError(res, 500, "Internal server error");
    }
    if(!vendor || vendor.token !== vendorData.token){
        return httpError(res, 401, "Unauthorized");
    }

    res.locals.vendor = vendor;
    next();
}

export {vendorAuth};
