import sharp from "sharp";
import crypto from "crypto";

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

export {
    addImages
};
