import mongoose from "mongoose";

const VariationSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    descriptor: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    shipping: {
        type: Number,
        required: true
    },
    images: {
        type: [String],
        required: false
    },
    priceId: {
        type: String,
        required: true
    },
    //enum: ship, buy, list
    purchaseOption: {
        type: String,
        required: true
    }
});

export default mongoose.model("variation", VariationSchema);
