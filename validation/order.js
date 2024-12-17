import {CustomError} from "../CustomError.js";
/*
 Validate data for an order
 Returns error if there is any invalid data

 @param {Object} data - Object containing any data for an order. Including:
    name
    address
 */
export default (data)=>{
    if(data.name){
        if(typeof(data.name) !== "string") throw new CustomError(400, "Invalid name");
    }

    if(data.address){
        if(typeof(data.address) !== "string") throw new CustomError(400, "Invalid address");
    }
}
