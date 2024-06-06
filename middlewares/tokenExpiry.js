const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

const checkTokenExpiry = (req, res, next) => {
  const authHeader = req.headers.Authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError("Unauthorized", 401));
  }

  // Verify the Access Token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return next(new AppError("Forbidden", 403));
    }

    req.user = user;
    next();
  });
};

module.exports = checkTokenExpiry;
