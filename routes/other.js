import {
    getDocumentRoute,
    getCartRoute
} from "../controllers/other.js";

export default (app)=>{
    app.get("/document/:document", getDocumentRoute)
    app.post("/cart", getCartRoute);
}
