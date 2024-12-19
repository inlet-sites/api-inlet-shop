import crypto from "crypto";

const encrypt = (text)=>{
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        process.env.ENCRYPTION_KEY,
        iv
    );
    const encrypted = cipher.update(text, "utf8", "hex");
    return {
        iv: iv.toString("hex"),
        encryptedData: encrypted + cipher.final("hex")
    };
}

const decrypt = (tokenData)=>{
    const {encryptedData, iv} = tokenData;
    const ivBuffer = Buffer.from(iv, "hex");
    const decipher = crypto.createDecipheriv(algorithm, process.env.ENCRYPTION_KEY, ivBuffer);
    const decrypted = decipher.update(encryptedData, "hex", "utf8");
    return decrypted + decipher.final("utf8");
}

const newUUID = ()=>{
    return crypto.randomUUID();
}

export {
    encrypt,
    decrypt,
    newUUID
}
