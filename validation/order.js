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

    if(data.email){
        if(typeof(data.email) !== "string") throw new CustomError(400, "Invalid email");
        if(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(data.email) !== true){
            throw new CustomError(400, "Invalid email");
        }
        if(data.email !== data.confirmEmail) throw new CustomError(400, "Email address mismatch");
    }
    
    if(data.from){
        const from = new Date(data.from);
        if(from.toString() === "Invalid Date") throw new CustomError(400, "Invalid 'from' date");
    }

    if(data.to){
        const to = new Date(data.to);
        if(to.toString() === "Invalid Date") throw new CustomError(400, "Invalid 'to' date");
    }

    if(data.status){
        const valids = ["incomplete", "paid", "paymentFailed", "declined", "confirmed", "shipped"];
        const statuses = data.status.split(",");
        for(let i = 0; i < statuses.length; i++){
            if(typeof(statuses[i]) !== "string") throw new CustomError(400, "Invalid status");
            if(!valids.includes(statuses[i])) throw new CustomError(400, `Invalid status '${statuses[i]}'`);
        }
        if(data.status === "declined" && !data.note){
            throw new CustomError(400, "Vendor note required");
        }
    }
}
