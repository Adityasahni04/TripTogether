const mongoose = require("mongoose");
const Schema = mongoose.Schema; // Fixed typo in "Schema"
const bcrypt = require('bcrypt');

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
      type: String, // Changed to 'String' for flexibility with phone formats
      required: true,
   },
   Password: {
      type: String,
      required: true,
   }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
   const user = this;
   if (!user.isModified('Password')) {
      return next();
   }
   try {
      const salt = await bcrypt.genSalt(10); // Use Blowfish cipher
      const hashedPassword = await bcrypt.hash(user.Password, salt);
      const hashedPhoneNumber=await bcrypt.hash(user.PhoneNumber,salt);
      user.PhoneNumber=hashedPhoneNumber;
      user.Password = hashedPassword;
      next();
   } catch (err) {
      next(err);
   }
});

// Method to compare passwords
userSchema.methods.comparePass = async function (receivedPass) {
   try {
      const isMatch = await bcrypt.compare(receivedPass, this.Password);
      return isMatch;
   } catch (error) {
      throw error;
   }
};

module.exports = mongoose.model("User", userSchema);
