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
        isCompleted: value.isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
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
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
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
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(StatusCodes.OK).json(task);
  } catch (e) {
    if (e.code === "P2025") { 
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: "Task not found", 
      }); 
    }

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

    const updatedTask = await prisma.task.update({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
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
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
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