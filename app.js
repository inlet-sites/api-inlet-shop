import express from "express";
import compression from "compression";
import mongoose from "mongoose";
import fileUpload from "express-fileupload";
import cors from "cors";

import {catchError} from "./CustomError.js";

import vendorRoutes from "./routes/vendor.js";
import productRoutes from "./routes/product.js";
import variationRoutes from "./routes/variation.js";
import orderRoutes from "./routes/order.js";
import otherRoutes from "./routes/other.js";

const app = express();
global.cwd = `${import.meta.dirname}`;

let mongoString = "mongodb://127.0.0.1/inletshop";
if(process.env.NODE_ENV === "production"){
    mongoString = `mongodb://inletshop:${process.env.MONGODB_PASS}@127.0.0.1:27017/inletsites?authSource=admin`;
}
mongoose.connect(mongoString);

app.use(compression());
app.use(express.json());
app.use(fileUpload({limits: {fileSize: 15 * 1024 * 1024}}));
app.use(cors());

vendorRoutes(app);
productRoutes(app);
variationRoutes(app);
orderRoutes(app);
otherRoutes(app);

app.use(catchError);

app.get("/", (req, res)=>{res.sendFile(`${global.cwd}/index.html`)});
app.get("/style.css", (req, res)=>{res.sendFile(`${global.cwd}/index.css`)});

if(process.env.NODE_ENV !== "production"){
    app.listen(8000);
}
export default app;
