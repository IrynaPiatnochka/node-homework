const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const prisma = require("../db/prisma");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const hashPassword = async(password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
};

const comparePassword = async(inputPassword, storedHash) => {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const { name, email, password } = value;

    const hashedPassword = await hashPassword(password);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });

        
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          priority: "medium",
          userId: user.id,
        },
        {
          title: "Add your first task",
          priority: "high",
          userId: user.id,
        },
        {
          title: "Explore the app",
          priority: "low",
          userId: user.id,
        },
      ];

      await tx.task.createMany({
        data: welcomeTaskData,
      });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: user.id,
          title: {
            in: welcomeTaskData.map((task) => task.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return {
        user,
        welcomeTasks,
      };
    });
    
    global.user_id = result.user.id;

    return res.status(StatusCodes.CREATED).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });

    } catch (err) {
      if (
        err.name === "PrismaClientKnownRequestError" && err.code === "P2002")
      {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "Email already registered",
        });
      }

      return next(err);
    }
  };


const logon = async(req, res, next) => {
  try {
    if (!req.body) req.body = {};
    let { email, password} = req.body;

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Email and password are required",
      });
    }

    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatch = await comparePassword(
      password,
      user.hashedPassword
    );

    if (!passwordMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Invalid email or password",
      });
    }

    global.user_id = user.id;

    return res.status(StatusCodes.OK).json({
      id: user.id,
      name:user.name,
      email: user.email,
    });
  } catch (e) {
    return next(e);
  }
};


const logoff = (req, res) => {
    global.user_id = null;
    res.sendStatus(StatusCodes.OK);
};

module.exports = { register, logon, logoff };