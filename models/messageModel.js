const mongoose = require("mongoose");
// eslint-disable-next-line node/no-unpublished-require
const validator = require("validator");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat is required"],
    },
    message: {
      type: String,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    imageUrl: {
      type: String,
      validator: {
        validate: function (v) {
          return validator.isURL(v);
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    videoUrl: {
      type: String,
      validator: {
        validate: function (v) {
          return validator.isURL(v);
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    fileUrl: {
      type: String,
      validator: {
        validate: function (v) {
          return validator.isURL(v);
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    fileName: {
      type: String,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: "sender",
    select: "username avatar _id",
  });
  next();
});

// populate the sender fields on create
messageSchema.pre("save", function (next) {
  this.populate({
    path: "sender",
    select: "username avatar _id",
  });
  next();
});

// post populate the sender fields on create
messageSchema.post("save", (doc, next) => {
  doc.populate({
    path: "sender",
    select: "username avatar _id",
  });
  next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
