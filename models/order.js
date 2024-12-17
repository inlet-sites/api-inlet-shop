import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    items: [{
        product: {
            type: String,
            required: true
        },
        variation: {
            type: String,
            required: true
        },
        quantity: {
            type: String,
            required: true
        }
    }],
    total: {
        type: Number,
        required: true
    },
    stripeCustomer: {
        type: String,
        required: true
    }
});

export default mongoose.model("order", OrderSchema);
