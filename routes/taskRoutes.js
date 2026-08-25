const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {
  create,
  index,
  show,
  bulkCreate,
  update,
  deleteTask,
} = require("../controllers/taskController");


router.use(jwtMiddleware);


router.post("/", create);
router.get("/", index);
router.post("/bulk", bulkCreate);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;