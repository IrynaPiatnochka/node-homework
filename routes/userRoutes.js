const express = require("express");
const router = express.Router();

const { register, logon, logoff } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", authMiddleware, logoff);

module.exports = router;

