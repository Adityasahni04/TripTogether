const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const groupSchema = new Schema({
    name: {
        required: true,
        type: String,
        unique: true, 

    },
    description: {
        type: String
    },
    location: {
        required: true,
        type: String,
    },
    members: [{
        phoneNumber: { type: String, required: true }, // Phone number instead of ObjectId
        role: { type: String, enum: ['admin', 'member'], default: 'member' }
    }],
    createdBy: { type: String, required: true }, // Phone number of the group creator
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
});

// Add a pre-save hook to update the `updated_at` field
groupSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

// Add a virtual for member count
groupSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Add instance method
groupSchema.methods.isMember = function (userId) {
    return this.members.includes(userId);
};

module.exports = mongoose.model("Group", groupSchema);
