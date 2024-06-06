/* eslint-disable prefer-destructuring */
const jwt = require("jsonwebtoken");
const { logger } = require("../utils/logger");
const User = require("../models/userModel");

const socketAuthMiddleware = (socket, next) => {
  let token;
  if (!socket.handshake.auth) {
    token = socket.handshake.headers.token;
  } else {
    token = socket.handshake.auth.token;
  }
  if (!token) {
    return next(new Error("Authentication error"));
  }

  console.log(token);
  next();
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // const user = await User.findById(decoded.id);
  // if (!user) {
  // return next(new Error("Authentication error"));
  // }

  // socket.user = user;
};

module.exports = socketAuthMiddleware;
