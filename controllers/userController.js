/* eslint-disable no-console */
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Chat = require("../models/chatModel");

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    user,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { username, email } = req.body;
  console.log(username, email);

  const user = await User.findByIdAndUpdate(
    { _id: req.user.id },
    { username, email },
    {
      new: true,
      runValidators: true,
    },
  );
  user.password = undefined;
  res.status(200).json({
    status: "success",
    user,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // Soft delete the user
  const user = await User.findById({ _id: req.user.id });
  user.status = "offline";
  // delete all the Chatrooms the user is part
  await Chat.deleteMany({ users: req.user.id });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.uploadAvatar = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  user.avatar = req.file.path;
  await user.save();
  res.status(200).json({
    status: "success",
    user,
  });
});

exports.getUsers = catchAsync(async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      username: { $regex: query, $options: "i" },
    });
    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Error retrieving Users: ", error);
    return res.status(500).json({
      message: "Error",
    });
  }
});
