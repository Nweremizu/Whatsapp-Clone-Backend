const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const express = require("express");
const session = require("express-session");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const { logger } = require("./utils/logger");

const app = express();

// -------------- Logging --------------
app.use(
  morgan((tokens, req, res) => {
    const msg = [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
    logger.http(msg);
    return null;
    // return msg;
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// -------------- Middlewares --------------
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://whatsapp-clone-frontend-pied.vercel.app",
    ],
    credentials: true,
  }),
); // Enable All CORS Requests
app.use(helmet()); // Secure HTTP headers
app.use(limiter); // Limit requests from an IP
app.use(
  session({
    secret: process.env.SESSION_SECRET, // A secret key to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: true, // Always create a session to ensure the cookie is set
    cookie: {
      secure: true,
    }, // Secure cookie
  }),
); // Session middleware
app.use(express.json()); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names

// -------------- Routes --------------
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Hello from the server!",
  });
});
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/auth", require("./routes/authRoutes"));

// 404 route
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
