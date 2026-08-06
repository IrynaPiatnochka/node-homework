const prisma = require("../db/prisma");
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

    const task = await prisma.task.create({
      data: {
        title: value.title,
        is_completed: value.isCompleted,
        user_id: global.user_id,
      },
      select: {
        id: true,
        title: true,
        is_completed: true,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      id: task.id,
      title: task.title,
      isCompleted: task.is_completed,
    });
  } catch (e) {
    return next(e);
  }
};
  

// Create Index
const index = async ( req, res, next) => {
  try {
    if (!requireUser(res)) return;

    const tasks = await prisma.task.findMany({
      where: {
        user_id: global.user_id,
      },
      select: {
        id: true,
        title: true,
        is_completed: true,
      },
    });

    if (tasks.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "No tasks found",
      });
    }

    return res.status(StatusCodes.OK).json(tasks);
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

    const task = await prisma.task.findUnique({
      where: {
        id_user_id: {
          id: taskId,
          user_id: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        is_completed: true,
      },
    });


    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }

    return res.status(StatusCodes.OK).json(task);
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

    if (value.isCompleted !== undefined) {
      value.is_completed = value.isCompleted;
      delete value.isCompleted;
    }

    const updatedTask = await prisma.task.update({
      where: {
        id_user_id: {
          id: taskId,
          user_id: global.user_id,
        },
      },
      data: value,
      select: {
        id: true,
        title: true,
        is_completed: true,
      },
    });

    return res.status(StatusCodes.OK).json(updatedTask);

  } catch (e) {
    if (e.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }

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

    const deletedTask = await prisma.task.delete({
      where: {
        id_user_id: {
          id: taskId,
          user_id: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        is_completed: true,
      },
    });

    return res.status(StatusCodes.OK).json(deletedTask);

  } catch (e) {
    if (e.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }

    return next(e);
  }
};

module.exports = { create, index, show, update, deleteTask };