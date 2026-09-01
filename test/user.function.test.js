require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users 
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user ", () => {
  let saveRes = null; 
  let loginRes = null;
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/api/users/register").send(newUser);
    expect(saveRes.status).toBe(201);
  });

  it("47. registration returns the expected name", () => {
    expect(saveRes.body.name).toBe("John Deere");
  });

  it("48. registration returns a csrfToken", () => {
    expect(saveRes.body.csrfToken).toBeDefined();
  });

  it("49. the user can logon", async () => {
    loginRes = await agent
      .post("/api/users/logon")
      .send({
        email: "jdeere@example.com",
        password: "Pa$$word20",
  });

    expect(loginRes.status).toBe(200);
  });

  it("50. a logged-in user can access /api/tasks", async () => {
    const tasksRes = await agent.get("/api/tasks");

    expect(tasksRes.status).not.toBe(401);
  });

  it("51. the user can logoff", async () => {
    const logoffRes = await agent
      .post("/api/users/logoff")
      .set("X-CSRF-TOKEN", loginRes.body.csrfToken);

    expect(logoffRes.status).toBe(200);
  });

  it("52. a logged-out user cannot access /api/tasks", async () => {
    const tasksRes = await agent.get("/api/tasks");

    expect(tasksRes.status).toBe(401);
  });
});

