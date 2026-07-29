const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/pg-pool");

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

const register = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const { name, email, password } = value;

    const hashedPassword = await hashPassword(password);

    let user;

    try {
      user = await pool.query(
        `INSERT INTO users (email, name, hashed_password)
         VALUES ($1, $2, $3)
         RETURNING id, email, name`,
        [email, name, hashedPassword]
      );

    } catch (e) {
      if (e.code === "23505") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "Email already exists",
        });
      }

      return next(e);
    }

    global.user_id = user.rows[0].id;

    return res.status(StatusCodes.CREATED).json({
      name: user.rows[0].name,
      email: user.rows[0].email,
    });
};


const logon = async(req, res) => {
    const { email, password} = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatch = await comparePassword(
      password,
      user.hashed_password
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
};

const logoff = (req, res) => {
    global.user_id = null;
    res.sendStatus(StatusCodes.OK);
};

module.exports = { register, logon, logoff };