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

    let user = null;

    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    } catch (err) {
      if (
        err.name === "PrismaClientKnownRequestError" && err.code === "P2002")
      {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "Email already exists",
        });
      }

      return next(err);
    }

    global.user_id = user.id;

    return res.status(StatusCodes.CREATED).json({
      name: user.name,
      email: user.email,
    });
};


const logon = async(req, res, next) => {
  try {
    let { email, password} = req.body;
    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email,
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