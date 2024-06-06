const AppError = require("../appError");

// handleCastErrorDB: This function is used to handle the CastError from Mongoose. It returns a new AppError with a message that includes the invalid path and value.
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// handleDuplicateFieldsDB: This function is used to handle the duplicate key error from Mongoose. It returns a new AppError with a message that includes the duplicate field value.
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// handleValidationErrorDB: This function is used to handle the validation error from Mongoose. It returns a new AppError with a message that includes all the validation errors.
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

// handleJWTError: This function is used to handle the JWT error. It returns a new AppError with a message that the token is invalid.
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

// handleJWTExpiredError: This function is used to handle the JWT expired error. It returns a new AppError with a message that the token has expired.
const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

module.exports = {
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  handleJWTError,
  handleJWTExpiredError,
};
