import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import fs from "fs";

const confirmToken = (vendor, token)=>{
    return vendor.token === token;
}

const passwordLength = (password)=>{
    return password.length >= 10;
}

const passwordMatch = (password, confirmPassword)=>{
    return password === confirmPassword;
}

const createPasswordHash = async (password)=>{
    return await bcrypt.hash(password, 10);
}

const newToken = (newToken)=>{
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
        .toFile(`${process.cwd()}/documents/${fileString}`);

    return fileString;
}

const removeImage = (file)=>{
    fs.unlink(`${process.cwd()}/documents/${file}`, (err)=>{console.error(err)});
}

const responseVendor = (vendor)=>{
    return {
        id: vendor._id,
        store: vendor.store,
        image: vendor.image
    };
}

export {
    confirmToken,
    passwordLength,
    passwordMatch,
    createPasswordHash,
    newToken,
    validPassword,
    createToken,
    createImage,
    removeImage,
    responseVendor
};
