import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

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

const responseVendor = (vendor)=>{
    return {
        id: vendor._id,
        email: vendor.email,
        owner: vendor.owner,
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
    responseVendor
};
