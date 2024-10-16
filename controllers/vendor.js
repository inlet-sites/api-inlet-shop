import bcrypt from "bcrypt";
import crypto from "crypto";

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

export {
    confirmToken,
    passwordLength,
    passwordMatch,
    createPasswordHash,
    newToken
};
