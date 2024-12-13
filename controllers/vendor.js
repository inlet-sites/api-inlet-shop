import Vendor from "../models/vendor.js";

import {CustomError} from "../CustomError.js";
import validate from "../validation/vendor.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import fs from "fs";

const createPassRoute = async (req, res, next)=>{
    try{
        validate(req.body);
        const vendor = await getVendor(req.params.vendorId);
        if(vendor.password) throw new CustomError(400, "Password already created");
        confirmToken(vendor, req.params.token);
        vendor.password = await createPasswordHash(req.body.password);
        vendor.token = newToken();
        await vendor.save();
        res.json({success: true});
    }catch(e){next(e)}
}

/*
 Retrieve vendor from an ID
 Throw error if no vendor with that ID

 @param {String} vendorId - ID of the vendor
 @return {Vendor} Vendor object
 */
const getVendor = async (vendorId)=>{
    const vendor = await Vendor.findOne({_id: vendorId});
    if(!vendor) throw new CustomError(400, "Vendor with this ID doesn't exist");
    return vendor;
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

const passwordLength = (password)=>{
    return password.length >= 10;
}

const passwordMatch = (password, confirmPassword)=>{
    return password === confirmPassword;
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
 Create a new UUID

 @return {String} Newly created UUID
 */
const newToken = ()=>{
    return crypto.randomUUID();
}

const validPassword = async (password, hashedPass)=>{
    return await bcrypt.compare(password, hashedPass);
}

const createToken = (vendor)=>{
    return jwt.sign({
        id: vendor._id,
        token: vendor.token
    }, process.env.JWT_SECRET);
}

const createImage = async (file)=>{
    let fileType = file.name.split(".");
    let fileName = fileType[0];
    fileType = fileType[fileType.length-1];
    let uuid = crypto.randomUUID();
    let fileString = `${uuid}.webp`;

    let image = await sharp(file.data)
        .resize({width: 1000})
        .webp({quality: 75})
        .toFile(`${global.cwd}/documents/${fileString}`);

    return fileString;
}

const removeImage = (file)=>{
    fs.unlink(`${global.cwd}/documents/${file}`, (err)=>{console.error(err)});
}

const updateVendor = (vendor, data)=>{
    if(data.slogan) vendor.slogan = data.slogan;
    if(data.description) vendor.description = data.description;
    if(data.phone) vendor.contact.phone = data.phone;
    if(data.email) vendor.contact.email = data.email;
    if(data.address) vendor.contact.address = data.address;

    return vendor;
}

const responseVendor = (vendor)=>{
    return {
        id: vendor._id,
        store: vendor.store,
        image: vendor.image,
        slogan: vendor.slogan,
        description: vendor.description,
        contact: vendor.contact,
        html: vendor.html
    };
}

export {
    createPassRoute,

    confirmToken,
    passwordLength,
    passwordMatch,
    createPasswordHash,
    newToken,
    validPassword,
    createToken,
    createImage,
    removeImage,
    updateVendor,
    responseVendor
};
