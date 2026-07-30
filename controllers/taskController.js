const pool = require("../db/pg-pool");
const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Checks login
const requireUser = (res) => {
  if (!global.user_id) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Unauthorized",
    });
    return false;
  }

  return true;
};

// Create controller
const create = async (req, res, next) => {
  try {

    if (!requireUser(res)) return;
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body);

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message, });
    }

    const task = await pool.query(
      `INSERT INTO tasks (title, is_completed, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed`,
      [value.title, value.isCompleted, global.user_id]
    );

    return res.status(StatusCodes.CREATED).json(task.rows[0]);
  } catch (e) {
    return next(e);
  }
};
  

// Create Index
const index = async ( req, res, next) => {
  try {
    if (!requireUser(res)) return;

    const tasks = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE user_id = $1`,
      [global.user_id]
    );

    if (tasks.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "No tasks found",
      });
    }

    return res.status(StatusCodes.OK).json(tasks.rows);
  } catch (e) {
    return next(e);
  }
};


// Show controller
const show = async (req, res, next) => {
  try {

    if (!requireUser(res)) return;

    const taskId = parseInt(req.params?.id);

    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid task ID",
      });
    }

    const task = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE id = $1
       AND user_id = $2`,
      [taskId, global.user_id]
    );

    if (task.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }

    return res.status(StatusCodes.OK).json(task.rows[0]);
  } catch (e) {
    return next(e);
  }
};


// Update controller
const update = async (req, res, next) => {
  try {
    if (!requireUser(res)) return;

    const { error, value } = patchTaskSchema.validate(req.body);

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.message,
      });
    }

    const taskId = parseInt(req.params?.id);

    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid task ID",
      });
    }

    let keys = Object.keys(value);

    keys = keys.map((key) =>
      key === "isCompleted" ? "is_completed" : key
    );

    const setClauses = keys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(", ");

    const idParm = `$${keys.length + 1}`;
    const userParm = `$${keys.length + 2}`;

    const updatedTask = await pool.query(
      `UPDATE tasks
      SET ${setClauses}
      WHERE id = ${idParm} AND user_id = ${userParm}
      RETURNING id, title, is_completed`,
      [...Object.values(value), taskId, global.user_id]
    );

    if (updatedTask.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }
    
    return res.status(StatusCodes.OK).json(updatedTask.rows[0]);
  } catch (e) {
    return next(e);
  }
};


// Delete controller
const deleteTask = async (req, res, next) => {
  try {
    if (!requireUser(res)) return;

    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid task ID",
      });
    }

    const deletedTask = await pool.query(
      `DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id, title, is_completed`,
      [taskId, global.user_id]
    );

    if (deletedTask.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }

    return res.status(StatusCodes.OK).json(deletedTask.rows[0]);
  } catch (e) {
    return next(e);
  }
};

module.exports = { create, index, show, update, deleteTask };