const mongoose = require("mongoose");
// eslint-disable-next-line node/no-unpublished-require
const validator = require("validator");
const Message = require("./messageModel");

const chatSchema = new mongoose.Schema(
  {
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: String,
    },
    lastMessageTime: {
      type: Date,
    },
    groupImage: {
      type: String,
      validator: {
        validate: function (v) {
          return validator.isURL(v);
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

chatSchema.pre("save", function (next) {
  if (this.users.length <= 1) {
    return next(new Error("Chat must have at least two users"));
  }
  next();
});

// check if the id of the users are unique
chatSchema.pre("save", function (next) {
  const userIds = this.users.map((user) => user.toString());
  if (userIds.length !== new Set(userIds).size) {
    return next(new Error("Chat cannot have duplicate users"));
  }
  next();
});

// on delete user, delete all the chatrooms the user is part of
chatSchema.pre("remove", async function (next) {
  await Message.deleteMany({ chatId: this._id });
  next();
});

// populate the users field
chatSchema.pre(/^find/, function (next) {
  this.populate({
    path: "users",
    select: "username email status",
  });
  next();
});

// on save, populate the users field
chatSchema.post("save", async (doc, next) => {
  await doc.populate("users");
  next();
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
