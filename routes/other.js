export default (app)=>{
    app.get("/document/:document", (req, res)=>{
        res.sendFile(`${process.cwd()}/documents/${req.params.document}`);
    });
}
