const createVariation = ()=>{
    return null;
}

const addImages = ()=>{
    return null;
}

const responseVariation = (variation)=>{
    return {
        id: variation._id,
        descriptor: variation.descriptor,
        quantity: variation.quantity,
        shipping: variation.shipping,
        images: variation.images,
        purchaseOption: variation.purchaseOption
    };
}

export {
    createVariation,
    addImages,
    responseVariation
};
