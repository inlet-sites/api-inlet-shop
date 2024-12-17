import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        variation: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        quantity: {
            type: String,
            required: true
        }
    }],
    subTotal: {
        type: Number,
        required: true
    },
    shipping: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    //enum: incomplete, complete, confirmed, shipped
    status: {
        type: String,
        required: true
    }
});

export default mongoose.model("order", OrderSchema);
