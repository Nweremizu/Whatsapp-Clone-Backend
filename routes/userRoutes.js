const express = require("express");
const multer = require("multer");
const protect = require("../middlewares/authMiddleware");
const users = require("../controllers/userController");
const { storage } = require("../storage/storage");

const upload = multer({ storage });

const router = express.Router();

router.get("/", protect.authenicateToken, users.getUsers);
router.route("/me").get(protect.authenicateToken, users.getMe);
router.route("/me").patch(protect.authenicateToken, users.updateMe);
router.route("/me").delete(protect.authenicateToken, users.deleteMe);
router
  .route("/me/avatar/:id")
  .post(protect.authenicateToken, upload.single("image"), users.uploadAvatar);
module.exports = router;
