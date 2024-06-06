const { logger } = require("../utils/logger");
const {
  handleCastErrorDB,
  handleJWTError,
  handleJWTExpiredError,
  handleValidationErrorDB,
  handleDuplicateFieldsDB,
} = require("../utils/handlers/errorHandler");

/**
 * Send detailed error response in development mode.
 *
 * @param {Object} err - The error object.
 * @param {Object} res - The response object.
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Send minimal error response in production mode.
 *
 * @param {Object} err - The error object.
 * @param {Object} res - The response object.
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: don't leak error details
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

/**
 * Global error handling middleware.
 *
 * @param {Object} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  logger.error(
    `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    if (err.name === "CastError") error = handleCastErrorDB(err);

    if (err.code === 11000) error = handleDuplicateFieldsDB(err);

    if (err.name === "ValidationError") error = handleValidationErrorDB(err);

    if (err.name === "JsonWebTokenError") error = handleJWTError(err);

    if (err.name === "TokenExpiredError") error = handleJWTExpiredError(err);

    sendErrorProd(error, res);
  }
};
