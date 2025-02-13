import Vendor from "../models/vendor.js";

import {CustomError} from "../CustomError.js";
import validate from "../validation/vendor.js";
import {encrypt, newUUID} from "../crypto.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import fs from "fs";
import stripePack from "stripe";

import sendEmail from "../sendEmail.js";
import resetPasswordEmail from "../email/resetPassword.js";

const stripe = stripePack(process.env.STRIPE_INLETSITES_KEY);

const createPassRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = await getVendor(req.params.vendorId);
        if(vendor.password) throw new CustomError(400, "Password already created");
        confirmToken(vendor, req.params.token);
        vendor.password = await createPasswordHash(req.body.password);
        vendor.token = newUUID();
        await vendor.save();
        res.json({success: true});
    }catch(e){next(e)}
}

const changePassRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        res.locals.vendor.password = await createPasswordHash(req.body.password);
        res.locals.vendor.token = newUUID();
        await res.locals.vendor.save();
        res.json({success: true});
    }catch(e){next(e)}
}

const getTokenRoute = async (req, res, next)=>{
    try{
        const vendor = await getVendorByEmail(req.body.email);
        await validPassword(req.body.password, vendor.password);
        const token = createToken(vendor);
        res.json({token: token});
    }catch(e){next(e)}
}

const getSelfRoute = (req, res, next)=>{
    try{
        res.json(responseVendorForSelf(res.locals.vendor));
    }catch(e){next(e)}
}

const getVendorRoute = async (req, res, next)=>{
    try{
        const vendor = await getVendorByUrl(req.params.vendorUrl);
        res.json(responseVendor(vendor));
    }catch(e){next(e)}
}

const getAllVendorsRoute = async (req, res, next)=>{
    try{
        const vendors = await getAllVendors();
        res.json(vendors);
    }catch(e){next(e)}
}

const updateRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = updateVendor(res.locals.vendor, req.body);
        if(req.body.stripeToken) await testToken(req.body.stripeToken);
        await vendor.save();
        res.json(responseVendorForSelf(vendor));
    }catch(e){next(e)}
}

const changeImageRoute = async (req, res, next)=>{
    try{
        const file = await createImage(req.files.file);
        if(res.locals.vendor.image) removeImage(res.locals.vendor.image);
        res.locals.vendor.image = file;
        await res.locals.vendor.save();
        res.json(responseVendorForSelf(res.locals.vendor));
    }catch(e){next(e)}
}

const passwordEmailRoute = async (req, res, next)=>{
    try{
        const vendor = await getVendorByEmail(req.body.email);
        sendEmail(
            vendor.email,
            vendor.name,
            "Password reset request",
            resetPasswordEmail(vendor.name, vendor._id, vendor.token)
        );
        res.json({success: true});
    }catch(e){next(e)}
}

const resetPasswordRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = await getVendor(req.body.vendor);
        confirmToken(vendor, req.body.token);
        vendor.password = await createPasswordHash(req.body.password);
        vendor.token = newUUID();
        await vendor.save();
        res.json({success: true});
    }catch(e){next(e)}
}

const createConnectRoute = async (req, res, next)=>{
    try{
        const account = await stripe.accounts.create({});
        res.locals.vendor.stripe.accountId = account.id;
        await res.locals.vendor.save();
        res.json({account: account.id});
    }catch(e){next(e)}
}

/*
 Retrieve vendor from an ID
 Throw error if no vendor with that ID

 @param {String} vendorId - ID of the vendor
 @return {Vendor} Vendor object
 */
const getVendor = async (vendorId)=>{
    const vendor = await Vendor.findOne({_id: vendorId, active: true});
    if(!vendor) throw new CustomError(400, "Vendor with this ID doesn't exist");
    return vendor;
}

/*
 Retrieve vendor from a URL
 Throw error if no vendor with that URL

 @param {String} url - URL of the vendor
 @return {Vendor} Vendor object
 */
const getVendorByUrl = async (url)=>{
    const vendor = await Vendor.findOne({url: url, active: true});
    if(!vendor) throw new CustomError(400, "Vendor with this URL doesn't exist");
    return vendor;
}

/*
 Retrieve vendor from an email address
 Throw error if no vendor with that email address

 @param {String} email - Vendor email address
 @return {Vendor} Vendor object
 */
const getVendorByEmail = async (email)=>{
    const vendor = await Vendor.findOne({email: email.toLowerCase(), active: true});
    if(!vendor) throw new CustomError(400, "Vendor with this email doesn't exist");
    return vendor;
}

/*
 Retrieve a list of all vendors

 @return {[Vendor]} List of vendors
 */
const getAllVendors = async ()=>{
    return await Vendor.find({active: true}, {
        store: 1,
        image: 1,
        slogan: 1,
        url: 1
    });
}

/*
 Throw error if provided token does not match vendor token

 @param {Vendor} vendor - Vendor object
 @param {String} token - Token provided for authorization
 */
const confirmToken = (vendor, token)=>{
    if(vendor.token !== token){
        throw new CustomError(400, "Invalid authorization");
    }
}

/*
 Hash a password

 @param {String} password - User provided password
 @return {String} Hashed password
 */
const createPasswordHash = async (password)=>{
    return await bcrypt.hash(password, 10);
}

/*
 Throw error if password doesn't match

 @param {String} password - Password to compare
 @param {String} hashedPass - Hashed password from database
 */
const validPassword = async (password, hashedPass)=>{
    const result = await bcrypt.compare(password, hashedPass);
    if(result !== true) throw new CustomError(401, "Invalid credentials");
}

/*
 Create JWT for vendor authorization

 @param {Vendor} vendor - Vendor object
 @return {String} JWT for vendor authorization
 */
const createToken = (vendor)=>{
    return jwt.sign({
        id: vendor._id,
        token: vendor.token
    }, process.env.JWT_SECRET);
}

/*
 Save image to server with unique UUID

 @param {File} file - Image file to save
 @return {String} Name of the newly created file
 */
const createImage = async (file)=>{
    let fileType = file.name.split(".");
    let fileName = fileType[0];
    fileType = fileType[fileType.length-1];
    let uuid = newUUID();
    let fileString = `${uuid}.webp`;

    let image = await sharp(file.data)
        .resize({width: 1000})
        .webp({quality: 75})
        .toFile(`${global.cwd}/documents/${fileString}`);

    return fileString;
}

/*
 Remove an image from the server

 @param {String} file - Filename to remove from server
 */
const removeImage = (file)=>{
    fs.unlink(`${global.cwd}/documents/${file}`, (err)=>{console.error(err)});
}

/*
 Update the data on a specific vendor

 @param {Vendor} vendor - Vendor object
 @param {Object} data - Object containing the data to be updated
 @return {Vendor} Updated Vendor object
 */
const updateVendor = (vendor, data)=>{
    if(data.slogan) vendor.slogan = data.slogan;
    if(data.description) vendor.description = data.description;
    if(data.phone) vendor.contact.phone = data.phone;
    if(data.email) vendor.contact.email = data.email;
    if(data.address) vendor.contact.address = data.address;
    if(data.stripeToken) vendor.stripeToken = encrypt(data.stripeToken);
    if(data.publishableKey) vendor.publishableKey = data.publishableKey;
    if(data.webhookSecret) vendor.webhookSecret = encrypt(data.webhookSecret);

    return vendor;
}

/*
 Test that a stripe token is valid and can create a product
 Throws error if it fails to create/delete a product

 @param {String} token - New Stripe API token
 */
const testToken = async (token)=>{
    try{
        const stripeTwo = stripePack(token);
        const product = await stripeTwo.products.create({name: "Test Product"});
        await stripeTwo.products.del(product.id);
    }catch(e){
        throw new CustomError(400, "Invalid Stripe token");
    }
}

/*
 Format vendor for the vendor to view
 Not for public use

 @param {Vendor} vendor - Vendor object
 @return {Object} - Formatted vendor object for the vendor to view
 */
const responseVendorForSelf = (vendor)=>{
    let canSell = false;
    if(
        vendor.stripeToken.encryptedData &&
        vendor.webhookSecret.encryptedData &&
        (
            vendor.contact.phone ||
            vendor.contact.email
        )
    ) canSell = true;

    return {
        id: vendor._id,
        email: vendor.email,
        owner: vendor.owner,
        store: vendor.store,
        url: vendor.url,
        image: vendor.image,
        slogan: vendor.slogan,
        description: vendor.description,
        contact: vendor.contact,
        webhook: Boolean(vendor.webhookSecret.encryptedData),
        onlineSales: canSell
    };
}

/*
 Format vendor for public viewing

 @param {Vendor} vendor - Vendor object
 @return {Object} - Formatted Vendor object
 */
const responseVendor = (vendor)=>{
    return {
        id: vendor._id,
        store: vendor.store,
        url: vendor.url,
        image: vendor.image,
        slogan: vendor.slogan,
        description: vendor.description,
        contact: vendor.contact,
        html: vendor.html
    };
}

export {
    createPassRoute,
    changePassRoute,
    getTokenRoute,
    getSelfRoute,
    getVendorRoute,
    getAllVendorsRoute,
    updateRoute,
    changeImageRoute,
    passwordEmailRoute,
    resetPasswordRoute,
    createConnectRoute
};
