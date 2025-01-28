export default (req, res, next)=>{
    let rawData = "";
    req.on("data", (chunk)=>{
        rawData += chunk;
    });

    req.on("end", ()=>{
        res.locals.rawBody = rawData;
        next();
    });
}
