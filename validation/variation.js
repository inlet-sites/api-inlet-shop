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
        if(typeof(data.descriptor) !== "string") throw new Error("Invalid descriptor");
        if(data.descriptor.length > 100) throw new Error("Invalid descriptor");
    }

    if(data.price){
        if(typeof(data.price) !== "number") throw new Error("Invalid price");
        if(!Number.isInteger(data.price)) throw new Error("Invalid price");
    }

    if(data.quantity){
        if(typeof(data.quantity) !== "number") throw new Error("Invalid quantity");
    }

    if(data.shipping){
        if(typeof(data.shipping) !== "number") throw new Error("Invalid shipping");
        if(!Number.isInteger(data.shipping)) throw new Error("Invalid shipping");
    }

    if(data.purchaseOption){
        if(
            data.purchaseOption !== "ship" &&
            data.purchaseOption !== "buy" &&
            data.purchaseOption !== "list"
        ) throw new Error("Invalid purchase option");
    }
}
