const mongoose = require("mongoose");

const ewalletSchema = new mongoose.Schema({
    orderId:{
        type: String,
    },
    userId:{
        type: String,
    },
    username:{
        type: String,
    },
    amount:{
        type: Number
    },
    refunddAt:{
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model("E-wallet", ewalletSchema);