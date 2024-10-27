import sharp from "sharp";
import crypto from "crypto";
import stripePack from "stripe";
import fs from "fs";

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
                .toFile(`${process.cwd()}/documents/${fileName}`)
        );
        newFiles.push(fileName);
    }

    await Promise.all(promises);
    return newFiles;
}

const removeImages = (images, product)=>{
    for(let i = 0; i < images.length; i++){
        const idx = product.images.indexOf(images[i]);
        if(idx !== -1){
            product.images.splice(idx, 1);
            fs.unlink(`${process.cwd()}/documents/${images[i]}`, (err)=>{
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
            active: active,
            default_price_data: {
                currency: "USD",
                unit_amount: price
            }
        });
    }catch(e){
        console.error(e);
    }

    return product.id;
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
    addImages,
    removeImages,
    createStripeProduct,
    updateProduct,
    responseProduct
};
