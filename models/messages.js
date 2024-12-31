const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    readBy: {
        type: [String], 
        default: [],   
    },
});

module.exports = mongoose.model("Message", messageSchema);
