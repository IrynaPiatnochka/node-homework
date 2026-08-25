const express = require("express");
const router = express.Router();

const {
  create,
  index,
  show,
  bulkCreate,
  update,
  deleteTask,
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/", create);
router.get("/", index);
router.post("/bulk", bulkCreate);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;