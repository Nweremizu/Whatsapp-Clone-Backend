const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// eslint-disable-next-line node/no-unpublished-require
const validator = require("validator");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  email: {
    type: String,
    validator: {
      validate: function (v) {
        return validator.isEmail(v);
      },
      message: (props) => `${props.value} is not a valid email address`,
    },
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    validator: {
      validate: function (v) {
        return v.length >= 6;
      },
      message: (props) => `${props.value} is not a valid password`,
    },
    required: [true, "Password is required"],
    select: false,
  },
  avatar: {
    type: String,
  },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "online",
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
