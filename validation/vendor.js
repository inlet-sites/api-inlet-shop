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
}
