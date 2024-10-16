import express from "express";
import compression from "compression";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

let mongoString = "mongodb://127.0.0.1/inletshop";
if(process.env.NODE_ENV === "production"){
    mongoString = `mongodb://website:${process.env.MONGODB_PASS}@127.0.0.1:27017/inletsites?authSource=admin`;
}
mongoose.connect(mongoString);

app.use(compression());
app.use(express.json());
app.use(cors());

if(process.env.NODE_ENV === "production"){
    export default app;
}else{
    app.listen(8000);
}
