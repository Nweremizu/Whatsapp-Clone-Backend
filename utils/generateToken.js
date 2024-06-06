const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRES_IN,
  });

  return accessToken;
};

const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
  };

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRES_IN,
  });

  return refreshToken;
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};

module.exports = { generateAccessToken, generateRefreshToken, cookieOptions };
