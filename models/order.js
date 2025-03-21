import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        required: true
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
    uuid: {
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
            type: Number,
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
    //enum: incomplete, paid, paymentFailed, declined, confirmed, shipped
    status: {
        type: String,
        required: true
    },
    paymentIntent: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    refunds: [{
        amount: Number,
        stripeId: String,
        date: Date
    }]
});

export default mongoose.model("order", OrderSchema);
