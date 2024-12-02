import sharp from "sharp";
import crypto from "crypto";
import stripePack from "stripe";
import fs from "fs";

const createVariations = async (variations, productId, vendorToken)=>{
    for(let i = 0; i < variations.length; i++){
        if(variations.length > 1 && !variations[i].descriptor){
            throw new Error("Missing a descriptor");
        }

        if(variations[i].images > 0){
            variations[i].images = await addImages(variations[i].images);
        }
        if(productId) variations[i].priceId = await createStripePrice(variations[i], productId, vendorToken);
    }

    return variations;
}

const createStripePrice = async (data, productId, vendorToken)=>{
    const stripe = stripePack(vendorToken);

    const price = await stripe.prices.create({
        currency: "usd",
        product: productId,
        tax_behavior: "inclusive",
        unit_amount: data.price
    });

    return price.id;
}

const validatePurchaseOption = (option)=>{
    switch(option){
        case "ship": return option;
        case "buy": return option;
        case "list": return option;
        default:
            throw new Error("Invalid purchase option");
    }
}

const addImages = async (files)=>{
    if(!files.length) files = [files];
    const promises = [];
    const newFiles = [];

    for(let i = 0; i < files.length; i++){
        let uuid = crypto.randomUUID();
        const fileName = `${uuid}.webp`;
        promises.push(
            sharp(files[i].data)
                .resize({width: 1000})
                .webp({quality: 75})
                .toFile(`${global.cwd}/documents/${fileName}`)
        );
        newFiles.push(fileName);
    }

    await Promise.all(promises);
    return newFiles;
}

/*
 Removes images from a product and deletes them from the server.
 If 'variation' is "none" then images removed from general image list.
 If 'variation' is an ID then images are removed from the variation.
 Returns a Product with the images removed.

 @param {[string]} images - Image file names to be removed
 @param {Product} product - full product object
 @param {string} variation - "none" or the ID of a variation on the product
 @return {Product} Full Product object with the images removed
 */
const removeImages = (images, product, variation)=>{
    let imagesArray;
    if(variation === "none"){
        imagesArray = product.images;
    }else{
        imagesArray = product.variations.find(v => v._id.toString() === variation).images;
    }

    for(let i = 0; i < images.length; i++){
        const idx = imagesArray.indexOf(images[i]);
        if(idx !== -1){
            imagesArray.splice(idx, 1);
            fs.unlink(`${global.cwd}/documents/${images[i]}`, (err)=>{
                if(err) console.error(err);
            });
        }
    }

    return product;
}

const createStripeProduct = async (token, name, active, price)=>{
    const stripe = stripePack(token);

    let product;
    try{
        product = await stripe.products.create({
            name: name,
            active: active
        });
    }catch(e){
        console.error(e);
    }

    return product.id;
}

const archiveStripeProduct = async (vendorId, productId)=>{
    const stripe = stripePack(vendorId);

    await stripe.products.update(
        productId,
        {active: false}
    );
}

const newStripePrice = async (stripe, productId, newPrice)=>{
    const price = await stripe.prices.create({
        product: productId,
        currency: "USD",
        unit_amount: newPrice
    });
    return price.id;
}

const updateProduct = async (data, product, token)=>{
    const stripe = stripePack(token);
    const stripeData = {};
    if(data.name){
        product.name = data.name;
        stripeData.name = data.name;
    }

    if(data.tags) product.tags = data.tags;

    if(data.description) product.description = data.description;

    if(data.price){
        product.price = Math.round(data.price);
        stripeData.default_price = await newStripePrice(stripe, product.stripeId, Math.round(data.price));
    }

    if(data.quantity) product.quantity = data.quantity;

    if(data.active !== undefined) product.active = data.active;

    if(data.variation && data.variation.id){
        const variation = product.variations.find(v => v._id.toString() === data.variation.id);
        const d = updateVariation(product, variation);
        await stripe.prices.update(
            
        );
    }

    if(Object.keys(stripeData).length > 0){
        await stripe.products.update(product.stripeId, stripeData);
    }

    return product;
}

const responseProduct = (product)=>{
    return {
        id: product._id,
        vendor: product.vendor,
        name: product.name,
        tags: product.tags,
        images: product.images,
        description: product.description,
        price: product.price,
        quantity: product.quantity
    };
}

export {
    createVariations,
    validatePurchaseOption,
    addImages,
    removeImages,
    createStripeProduct,
    archiveStripeProduct,
    updateProduct,
    responseProduct
};
