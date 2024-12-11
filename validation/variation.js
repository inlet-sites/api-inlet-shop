import {CustomError} from "../CustomError.js";
/*
 Validate data for a product variation
 Returns error if there is any invalid data

 @param {Object} data - Object containing any data from a variation. Including:
    descriptor,
    price,
    quantity,
    shipping,
    purchaseOption
 */

export default (data)=>{
    if(data.descriptor){
        if(typeof(data.descriptor) !== "string") throw new CustomError(400, "Invalid descriptor");
        if(data.descriptor.length > 100) throw new CustomError(400, "Invalid descriptor");
    }

    if(data.price){
        try{
            if(typeof(data.price === "string")) data.price = Number(data.price);
        }catch(e){throw new CustomError(400, "Invalid price")}
        if(typeof(data.price) !== "number") throw new CustomError(400, "Invalid price");
        if(!Number.isInteger(data.price)) throw new CustomError(400, "Invalid price");
    }

    if(data.quantity){
        try{
            if(typeof(data.quantity) === "string") data.quantity = Number(data.quantity);
        }catch(e){throw new CustomError(400, "Invalid quantity")}
        if(typeof(data.quantity) !== "number") throw new CustomError(400, "Invalid quantity");
    }

    if(data.shipping){
        try{
            if(typeof(data.shipping) === "string") data.shipping = Number(data.shipping);
        }catch(e){throw new CustomError(400, "Invalid shipping")}
        if(typeof(data.shipping) !== "number") throw new CustomError(400, "Invalid shipping");
        if(!Number.isInteger(data.shipping)) throw new CustomError(400, "Invalid shipping");
    }

    if(data.purchaseOption){
        if(
            data.purchaseOption !== "ship" &&
            data.purchaseOption !== "buy" &&
            data.purchaseOption !== "list"
        ) throw new CustomError(400, "Invalid purchase option");
    }
}
