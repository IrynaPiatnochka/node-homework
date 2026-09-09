const prisma = require("../db/prisma");
const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");


// Create controller
const create = async (req, res, next) => {
  try {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body);

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message, });
    }

    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
    });
  } catch (e) {
    return next(e);
  }
};
  

// Create Index
const index = async ( req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const whereClause = {
      userId: req.user.id,
    };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (tasks.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Tasks not found",
      });
    }

    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };


    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
      createdAt: task.createdAt,
      User: task.user,
    }));

    return res.status(StatusCodes.OK).json({
      tasks: formattedTasks,
      pagination,
    });
  } catch (e) {
    return next(e);
  }
};


// Show controller
const show = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params?.id);

    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid task ID",
      });
    }

    const task = await prisma.task.findUniqueOrThrow({
      where: {
        id_userId: {
          id: taskId,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(StatusCodes.OK).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      User: task.user,
    });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }

    return next(e);
  }
};

// Bulk Create
const bulkCreate = async (req, res, next) => {
  try {
    const tasks = req.body?.tasks;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Tasks must be a non-empty array",
      });
    }

    const validatedTasks = [];

    for (const task of tasks) {
      const { error, value } = taskSchema.validate(task);

      if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: error.message,
        });
      }

      validatedTasks.push({
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: req.user.id,
      });
    }

    const result = await prisma.task.createMany({
      data: validatedTasks,
    });

    return res.status(StatusCodes.CREATED).json({
      tasksCreated: result.count,
      totalRequested: tasks.length,
    });
  } catch (e) {
    return next(e);
  }
};


// Update controller
const update = async (req, res, next) => {
  try {

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
          userId: req.user.id,
        },
      },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
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
          userId: req.user.id,
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

module.exports = { create, index, show, bulkCreate, update, deleteTask };