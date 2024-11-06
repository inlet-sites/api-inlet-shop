export default (app)=>{
    app.get("/document/:document", (req, res)=>{
        res.sendFile(`${global.cwd}/documents/${req.params.document}`);
    });
}
