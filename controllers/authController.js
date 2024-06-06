const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  generateAccessToken,
  generateRefreshToken,
  cookieOptions,
} = require("../utils/generateToken");

exports.signup = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("User already exists", 400));
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Send refresh token as a cookie
  res.cookie("refreshToken", refreshToken, cookieOptions).status(201).json({
    status: "success",
    accessToken,
    user,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  // username csn be email or username
  const { username, password } = req.body;
  let user;
  if (!username || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  if (username.includes("@")) {
    const email = username;
    user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password, user.password))) {
      return next(new AppError("Invalid email or password", 401));
    }
  } else {
    user = await User.findOne({ username }).select("+password");
    if (!user || !(await user.comparePassword(password, user.password))) {
      return next(new AppError("Invalid email or password", 401));
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Send refresh token as a cookie
  res.cookie("refreshToken", refreshToken, cookieOptions).status(200).json({
    status: "success",
    accessToken,
    user,
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new AppError("Please login to continue", 401));
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return next(new AppError("Invalid token", 401));
  }

  const user = await User.findById(payload.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Send refresh token as a cookie
  res.cookie("refreshToken", newRefreshToken, cookieOptions).status(200).json({
    status: "success",
    accessToken,
    user,
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("refreshToken", cookieOptions).status(200).json({
    status: "success",
  });
});
