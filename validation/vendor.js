import {CustomError} from "../CustomError.js";

/*
 Validate Data for a vendor
 Returns error if there is any invalid data

 @param {Object} data - Object containing any data from Vendor. Including:

 */
export default (data)=>{
    if(data.password){
        if(typeof(data.password) !== "string") throw new CustomError(400, "Invalid password");
        if(data.password.length < 10){
            throw new CustomError(400, "Password must contain at least 10 characters");
        }
        if(data.confirmPassword && data.password !== data.confirmPassword){
            throw new CustomError(400, "Passwords do not match");
        }
    }

    if(data.slogan){
        if(typeof(data.slogan) !== "string") throw new CustomError(400, "Invalid slogan");
        if(data.slogan.length > 250) throw new CustomError(400, "Slogan cannot contain more than 250 characters");
    }

    if(data.description){
        if(typeof(data.description) !== "string") throw new CustomError(400, "Invalid description");
    }

    if(data.phone){
        if(typeof(data.phone) !== "string") throw new CustomError(400, "Invalid phone");
    }

    if(data.email){
        if(typeof(data.email) !== "string") throw new CustomError(400, "Invalid email");
        if(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(data.email) !== true){
            throw new CustomError(400, "Invalid email");
        }
    }

    if(data.address){
        if(typeof(data.address.text) !== "string") throw new CustomError(400, "Invalid address");
        if(typeof(data.address.link) !== "string") throw new CustomError(400, "Invalid address");
    }
}
