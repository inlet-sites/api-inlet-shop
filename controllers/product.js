import sharp from "sharp";
import crypto from "crypto";
import stripePack from "stripe";
import fs from "fs";

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
 Returns a Product with the images removed.

 @param {[string]} images - Image file names to be removed
 @param {Product} product - full product object
 @return {Product} Full Product object with the images removed
 */
const removeImages = (images, product)=>{
    for(let i = 0; i < images.length; i++){
        const idx = product.images.indexOf(images[i]);
        if(idx !== -1){
            product.images.splice(idx, 1);
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

/*
 Checks validity of input data
 Updates the information on the product
 Updates Stripe product/price data as necessary

 @param {Object} data - Data from the request body
 @param {Product} product - The product to be updated
 @param {String} token - Stripe token for the vendor
 @return {Product} The updated product
 */
const updateProduct = async (data, product, token)=>{
    const stripe = stripePack(token);
    const stripeData = {};
    if(data.name){
        product.name = data.name;
        stripeData.name = data.name;
    }

    if(data.tags) product.tags = data.tags;

    if(data.description) product.description = data.description;

    if(data.active !== undefined) product.active = data.active;

    if(Object.keys(stripeData).length > 0){
        await stripe.products.update(product.stripeId, stripeData);
    }

    return product;
}

const responseProduct = (product, variations)=>{
    return {
        id: product._id,
        name: product.name,
        tags: product.tags,
        images: product.images,
        description: product.description,
        variations: variations
    };
}

export {
    addImages,
    removeImages,
    createStripeProduct,
    archiveStripeProduct,
    updateProduct,
    responseProduct
};
