const prisma = require("../db/prisma");
const { StatusCodes } = require("http-status-codes");

const getUserAnalytics = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId) || userId <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid user ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "User not found",
      });
    }

    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: {
        userId,
      },
      _count: {
        id: true,
      },
    });

    const recentTasks = await prisma.task.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const formattedRecentTasks = recentTasks.map((task) => ({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
      createdAt: task.createdAt,
      userId: task.userId,
      User: task.user,
    }));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      taskStats,
      recentTasks, formattedRecentTasks,
      weeklyProgress,
    });
  } catch (e) {
    return next(e);
  }
};

const getUsersWithStats = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (!Number.isInteger(page) || page < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Page must be an integer greater than or equal to 1",
    });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Limit must be an integer between 1 and 100",
    });
    }

    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tasks: {
        where: {
            isCompleted: false,
        },
        select: {
            id: true,
        },
        take: 5,
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: {
        Task: user._count.tasks,
      },
      Task: user.tasks,
    }));

    const totalUsers = await prisma.user.count();

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1,
    };

    return res.status(StatusCodes.OK).json({
      users,
      pagination,
    });
  } catch (e) {
    return next(e);
  }
};

const searchTasks = async (req, res, next) => {
  try {
    const searchQuery = req.query.q?.trim();

    if (!searchQuery || searchQuery.length < 2) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Search query must be at least 2 characters long",
      });
    }

    const limit = Number(req.query.limit ?? 20);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Limit must be an integer between 1 and 100",
    });
    }

    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    const searchResults = await prisma.$queryRaw`
      SELECT
        t.id,
        t.title,
        t.is_completed AS "isCompleted",
        t.priority,
        t.created_at AS "createdAt",
        t.user_id AS "userId",
        u.name AS "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern}
         OR u.name ILIKE ${searchPattern}
      ORDER BY
        CASE
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    return res.status(StatusCodes.OK).json({
      results: searchResults,
      query: searchQuery,
      count: searchResults.length,
    });
  } catch (e) {
    return next(e);
  }
};

module.exports = { getUserAnalytics, getUsersWithStats, searchTasks };

