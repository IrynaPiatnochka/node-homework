const express = require("express");
const timeRouter = require("./routes/timeRoutes");

const app = express();

app.use(express.json());

app.use("/api", timeRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

// app.all("/{*splat}", (req, res) => {
//   res.status(404).json({
//     message: `No route found for ${req.method} ${req.path}`,
//   });
// });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };