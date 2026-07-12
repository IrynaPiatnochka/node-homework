const register = (req, res) => {

    const { name, email, password } = req.body;

    const user = { name, email, password };

    global.users.push(user);

    global.user_id = user;

    res.status(201).json({ name, email });

};

const logon = (req, res) => {

    const { email, password} = req.body;

    const user = global.users.find((user) => {
        return user.email === email && user.password === password;
    });
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    global.user_id = user;

    res.status(200).json({
        name:user.name,
        email: user.email
    });
};

const logoff = (req, res) => {

    global.user_id = null;

    res.status(200).json({
        message: "Logged off successfully"
    });
};

module.exports = { register, logon, logoff };