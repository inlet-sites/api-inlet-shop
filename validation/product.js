import {CustomError} from "../CustomError.js";
/*
 Validate Data for a product
 Returns error if there is any invalid data

 @param {Object} data - Object containing any data from Product. Including:
    name
    tags
    description
    active
    archived
    stripeId
 */
export default (data)=>{
    if(data.name){
        if(typeof(data.name) !== "string") throw new CustomError(400, "Invalid name");
    }

    if(data.tags){
        if(!Array.isArray(data.tags)) throw new CustomError(400, "Invalid tags");
        if(data.tags.some(t => typeof(t) !== "string")) throw new CustomError(400, "Invalid tags");
    }

    if(data.description){
        if(typeof(data.description) !== "string") throw new CustomError(400, "Invalid description");
    }

    if(data.active){
        if(typeof(data.active) !== "boolean") throw new CustomError(400, "Invalid active status");
    }

    if(data.archived){
        if(typeof(data.archived) !== "boolean") throw new CustomError(400, "Invalid archive status");
    }

    if(data.stripeId){
        if(typeof(data.stripeId) !== "string") throw new CustomError(400, "Invalid Stripe ID");
    }
}
