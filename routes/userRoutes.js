const express = require("express");
const protect = require("../middlewares/authMiddleware");
const users = require("../controllers/userController");

const router = express.Router();

router.route("/me").get(protect.authenicateToken, users.getMe);
router.route("/me").patch(protect.authenicateToken, users.updateMe);
router.route("/me").delete(protect.authenicateToken, users.deleteMe);

module.exports = router;
