const mongoose = require("mongoose");

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
    price: {
        type: Number,
        required: false
    },
    quantity: {
        type: Number,
        required: false
    }
});

export default mongoose.model("product", ProductSchema);
