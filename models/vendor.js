import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true
    },
    store: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    token: {
        type: String,
        required: true
    },
    stripeToken: {
        type: String,
        required: false
    }
});

export default mongoose.model("vendor", VendorSchema);
