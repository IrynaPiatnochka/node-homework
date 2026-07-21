const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");

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

    const existingUser = global.users.find(
      (user) => user.email === email
    );

    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Email already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = { 
      name, 
      email, 
      hashedPassword, 
    };

    global.users.push(newUser);
    global.user_id = newUser;

    const { hashedPassword: _, ...sanitizedUser } = newUser;

    return res.status(StatusCodes.CREATED).json(sanitizedUser);
};


const logon = async(req, res) => {
    const { email, password} = req.body;

    const user = global.users.find((user) => {
        return user.email === email;
    });

    const passwordMatch =
      user && await comparePassword(password, user.hashedPassword); 

    if (!passwordMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Invalid email or password",
      });
    }

    global.user_id = user;

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