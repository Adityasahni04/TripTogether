const mongoose = require("mongoose");
const Schema = mongoose.Schema; // Fix typo in "Sechma"

// Define the schema for the User model
const userSchema = new Schema({
   Name: {
      type: String,
      required: true,
   },
   Email: {
      type: String,
      required: true,
   },
   PhoneNumber: {
      type: Number, // Use 'Number' for numeric values
      required: true,
   },
   Password: {
      type: String,
      required: true,
   }
});

module.exports = mongoose.model("User", userSchema);
