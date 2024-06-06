const express = require("express");
const auth = require("../controllers/authController");

const router = express.Router();

router.route("/signup").post(auth.signup);
router.route("/login").post(auth.login);
router.route("/refreshToken").post(auth.refreshToken);
router.route("/logout").post(auth.logout);

module.exports = router;
