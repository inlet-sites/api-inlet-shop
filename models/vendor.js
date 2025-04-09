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
    publicData: {
        phone: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: false
        },
        address: {
            text: {
                type: String,
                required: false
            },
            link: {
                type: String,
                required: false
            }
        },
        slogan: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        image: {
            type: String,
            required: false
        },
        hours: {
            sunday: [Date, Date],
            monday: [Date, Date],
            tuesday: [Date, Date],
            wednesday: [Date, Date],
            thursday: [Date, Date],
            friday: [Date, Date],
            saturday: [Date, Date]
        },
        links: [{
            url: String,
            text: String
        }],
        website: {
            type: String,
            required: false
        }
    }
    html: {
        type: String,
        required: false
    },
    active: {
        type: Boolean,
        required: true
    },
    newOrderSendEmail: {
        type: Boolean,
        required: true
    },
    stripe:{
        accountId: {
            type: String,
            required: false,
        },
        activated: {
            type: Boolean,
            required: false
        }
    }
});

export default mongoose.model("vendor", VendorSchema);

/*
 New Vendor required data:
     email
     owner
     store
     url
     token
     active
     newOrderSendEmail
 */
