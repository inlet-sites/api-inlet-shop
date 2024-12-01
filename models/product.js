import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    tags: [String],
    images: [String],
    description: String,
    active: {
        type: Boolean,
        required: true
    },
    archived: {
        type: Boolean,
        required: true
    },
    stripeId: {
        type: String,
        required: false
    },
    variations: [{
        descriptor: String,
        price: Number,
        quantity: Number,
        shipping: Number,
        images: [String],
        priceId: String
    }],
    //enum: ship, buy, list
    purchaseOption: {
        type: String,
        required: true
    }
});

export default mongoose.model("product", ProductSchema);
