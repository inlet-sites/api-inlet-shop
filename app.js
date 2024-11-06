import express from "express";
import compression from "compression";
import mongoose from "mongoose";
import fileUpload from "express-fileupload";
import cors from "cors";

const app = express();

let mongoString = "mongodb://127.0.0.1/inletshop";
if(process.env.NODE_ENV === "production"){
    mongoString = `mongodb://inletshop:${process.env.MONGODB_PASS}@127.0.0.1:27017/inletsites?authSource=admin`;
}
mongoose.connect(mongoString);

app.use(compression());
app.use(express.json());
app.use(fileUpload({limits: {fileSize: 15 * 1024 * 1024}}));
app.use(cors());

import vendorRoutes from "./routes/vendor.js";
vendorRoutes(app);
import productRoutes from "./routes/product.js";
productRoutes(app);
import otherRoutes from "./routes/other.js";
otherRoutes(app);

app.get("/", (req, res)=>{res.sendFile(`${process.cwd()}/index.html`)});
app.get("/style.css", (req, res)=>{res.sendFile(`${process.cwd()}/index.css`)});

if(process.env.NODE_ENV !== "production"){
    app.listen(8000);
}
export default app;
