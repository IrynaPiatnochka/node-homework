const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Helper function
let taskId = 0;

const taskCounter = () => {
    taskId++;
    return taskId;
};

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
const create = (req, res) => {

  if (!requireUser(res)) return;
  
  if (!req.body) req.body = {};

  
  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message, });
  }

  const newTask = {
    id: taskCounter(),
    ...value,
    userId: global.user_id.email,
  };

  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;
  res.status(StatusCodes.CREATED).json(sanitizedTask);
};


// Create Index
const index = ( req, res) => {

  if (!requireUser(res)) return;

  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );

  if (userTasks.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      error: "Task not found",
    });
  }

  const sanitizedTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });

  return res.status(StatusCodes.OK).json(sanitizedTasks);
};


// Show controller
const show = (req, res) => {

  if (!requireUser(res)) return;

  const taskId = parseInt(req.params?.id);

  if (isNaN(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Invalid task ID",
    });
  }

  const task = global.tasks.find(
    (task) =>
      task.id === taskId &&
      task.userId === global.user_id.email
  );

  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).json({
      error: "Task not found",
    });
  }

  const { userId, ...sanitizedTask } = task;

  return res.status(StatusCodes.OK).json(sanitizedTask);
};


// Update controller
const update = (req, res) => {

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

  const task = global.tasks.find(
    (task) =>
      task.id === taskId &&
      task.userId === global.user_id.email
  );

  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).json({
      error: "Task not found",
    });
  }

  Object.assign(task, value);
  const { userId, ...sanitizedTask } = task;
  return res.status(StatusCodes.OK).json(sanitizedTask);
};


// Delete controller
const deleteTask = (req, res) => {

  if (!requireUser(res)) return;

  const taskId = parseInt(req.params?.id);

  if (isNaN(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Invalid task ID",
    });
  }

  const taskIndex = global.tasks.findIndex(
    (task) =>
      task.id === taskId &&
      task.userId === global.user_id.email
  );

  if (taskIndex === -1) {
    return res.status(StatusCodes.NOT_FOUND).json({
      error: "Task not found",
    });
  }

  const task = global.tasks[taskIndex];
  const { userId, ...sanitizedTask } = task;
  global.tasks.splice(taskIndex, 1);
  return res.status(StatusCodes.OK).json(sanitizedTask);
};

module.exports = { create, index, show, update, deleteTask, };