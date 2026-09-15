const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const prisma = require("../db/prisma");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  const payload = {
    id: user.id,
    csrfToken: randomUUID(),
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("jwt", token, {
    ...cookieFlags(req),
    maxAge: 3600000,
  });

  return payload.csrfToken;
};

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

  try {
    let isPerson = false;

    if (req.body.recaptchaToken) {
      const token = req.body.recaptchaToken;

      const params = new URLSearchParams();
      params.append("secret", process.env.RECAPTCHA_SECRET);
      params.append("response", token);
      params.append("remoteip", req.ip);

      const response = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          body: params.toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const data = await response.json();

      if (data.success) isPerson = true;

      delete req.body.recaptchaToken;
    } else if (
      process.env.RECAPTCHA_BYPASS &&
      req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
    ) {
      isPerson = true;
    }

    if (!isPerson) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "Bot verification failed. Please complete the reCAPTCHA.",
      });
    }

    const { error, value } = userSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { name, email, password } = value;

    const hashedPassword = await hashPassword(password);

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

    const csrfToken = setJwtCookie(req, res, result.user);

    return res.status(StatusCodes.CREATED).json({
      user: result.user,
      csrfToken,
    });
  } catch (err) {
    if (
      err.name === "PrismaClientKnownRequestError" &&
      err.code === "P2002"
    ) {
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

    const csrfToken = setJwtCookie(req, res, user);

    return res.status(StatusCodes.OK).json({
      name:user.name,
      email: user.email,
      csrfToken,
    });
  } catch (e) {
    return next(e);
  }
};


const googleLogon = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Authorization code is required",
      });
    }

    const { tokens } = await googleClient.getToken(code);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const name = payload.name;
    const email = payload.email;

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      const csrfToken = setJwtCookie(req, res, existingUser);


      console.log(csrfToken)
      return res.status(StatusCodes.OK).json({
        name: existingUser.name,
        email: existingUser.email,
        csrfToken,
          });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        hashedPassword: "oauth-user",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const csrfToken = setJwtCookie(req, res, newUser);

    return res.status(StatusCodes.OK).json({
      name: newUser.name,
      email: newUser.email,
      csrfToken,
    });
    
  } catch (e) {
    return next(e);
  }
};


  const logoff = (req, res) => {
    res.clearCookie("jwt", cookieFlags(req));
    res.sendStatus(StatusCodes.OK);
};

module.exports = { register, logon, googleLogon, logoff };