const express = require("express");
const prisma = require("./db/prisma");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

const userRouter = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const taskRouter = require("./routes/taskRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.set("trust proxy", 1);

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);

app.use(helmet());

app.use(express.json());
app.use(cookieParser());

app.use(xss());

app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    if (err.name === "PrismaClientInitializationError") {
      console.error("Couldn't connect to the database. Is it running?")
    }
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message
    });
  }
});

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

const shutdown = async () => {
  console.log("Shutting down...");

  server.close(async () => {
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = { app, server };