const express = require("express");
const router = express.Router();

const {
  create,
  index,
  show,
  update,
  deleteTask,
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", create);
router.get("/", index);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;