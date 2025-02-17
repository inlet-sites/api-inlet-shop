import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    store: {
        type: String,
        required: true
    },
    url: {
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
        iv: {
            type: String,
            required: false
        },
        encryptedData: {
            type: String,
            required: false
        }
    },
    publishableKey: {
        type: String,
        required: false
    },
    webhookSecret: {
        iv: {
            type: String,
            required: false
        },
        encryptedData: {
            type: String,
            required: false
        }
    },
    image: {
        type: String,
        required: false
    },
    slogan: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    contact: {
        phone: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: false
        },
        address: {
            type: String,
            required: false
        }
    },
    html: {
        type: String,
        required: false
    },
    active: {
        type: Boolean,
        required: true
    }
});

export default mongoose.model("vendor", VendorSchema);
