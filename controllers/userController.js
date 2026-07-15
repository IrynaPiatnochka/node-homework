const { StatusCodes } = require("http-status-codes");

const register = (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Missing required fields",
      });
    }

    const existingUser = global.users.find(
      (user) => user.email === email
    );

    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Email already exists",
      });
    }

    const newUser = { name, email, password };

    global.users.push(newUser);
    global.user_id = newUser;

    return res.status(StatusCodes.CREATED).json({ name, email });
};

const logon = (req, res) => {

    const { email, password} = req.body;

    const user = global.users.find((user) => {
        return user.email === email && user.password === password;
    });
    if (!user) {
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