import mongoose from "mongoose";

const VariationSchema = new mongoose.Schema({
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
        required: false
    },
    //enum: ship, buy, list
    purchaseOption: {
        type: String,
        required: true
    },
    archived: {
        type: Boolean,
        required: true
    }
}, {
    autocreate: false,
    autoIndex: false
});
const Variation = mongoose.model("variation", VariationSchema);

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
    variations: [VariationSchema]
});
const Product = mongoose.model("product", ProductSchema);

export {
    Product,
    Variation
}
