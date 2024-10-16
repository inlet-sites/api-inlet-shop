import Vendor from "../models/vendor.js";

import {httpError} from "../error.js";

const vendor = (app)=>{
    app.put("/vendor/:vendorId/password/:token", (req, res)=>{
        console.log("something");
        //get user
        //confirm id/token match
        //confirm password is 10 chars
        //confirm passwords match
        //set password
        //return response
    });
}

export default vendor;
