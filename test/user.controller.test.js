require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const EventEmitter = require("events");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");

const {
  register,
  logoff,
  logon,
} = require("../controllers/userController");

const jwtMiddleware = require("../middleware/jwtMiddleware");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

let registerRes = null;
let saveRes = null;
let saveData = null;
let jwtCookie = null;
let saveReq = null;

function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });

  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);

    let currentHeader = res.getHeader("Set-Cookie");

    if (currentHeader === undefined) {
      currentHeader = [];
    }

    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };

  return res;
}

beforeAll(async () => {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("testing logon, register, and logoff", () => {
  it("33. A user can be registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        name: "Bob",
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    registerRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(register, req, registerRes);

    expect(registerRes.statusCode).toBe(201);
  });

  it("34. The user can logon.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(logon, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });
});

it("35. A cookie starts with jwt=", () => {
  const setCookieArray = saveRes.get("Set-Cookie");

  jwtCookie = setCookieArray.find((str) =>
    str.startsWith("jwt="),
  );

  expect(jwtCookie.startsWith("jwt=")).toBe(true);
});

it("36. The JWT cookie contains HttpOnly", () => {
  expect(jwtCookie).toContain("HttpOnly");
});

it("37. The returned data has the expected name", () => {
  saveData = registerRes._getJSONData();

  expect(saveData.name).toBe("Bob");
});

it("38. The returned data contains a csrfToken", () => {
  expect(saveData.csrfToken).toBeDefined();
});

it("39. The user can logoff.", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
  });

  saveRes = MockResponseWithCookies();

  await waitForRouteHandlerCompletion(logoff, req, saveRes);

  expect(saveRes.statusCode).toBe(200);
});

it("40. The logoff clears the cookie.", () => {
  const setCookieArray = saveRes.get("Set-Cookie");

  jwtCookie = setCookieArray.find((str) =>
    str.startsWith("jwt="),
  );

  expect(jwtCookie).toContain("Jan 1970");
});

it("41. A logon attempt with a bad password returns a 401", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: {
      email: "bob@sample.com",
      password: "WrongPassword123!",
    },
  });

  const res = MockResponseWithCookies();

  await waitForRouteHandlerCompletion(logon, req, res);

  expect(res.statusCode).toBe(401);
});

it("42. You can't register with an email address that is already registered", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: {
      name: "Bob Again",
      email: "bob@sample.com",
      password: "Pa$$word20",
    },
  });

  const res = MockResponseWithCookies();

  await waitForRouteHandlerCompletion(register, req, res);

  expect(res.statusCode).toBe(400);
});


describe("Testing JWT middleware", () => {
    it("61. Returns a 401 if the JWT cookie is not present", async () => {
      const req = httpMocks.createRequest({
        method: "POST",
      });

      saveRes = MockResponseWithCookies();

      await waitForRouteHandlerCompletion(
        jwtMiddleware,
        req,
        saveRes,
      );

      expect(saveRes.statusCode).toBe(401);
    });

    it("62. Returns a 401 if the JWT is invalid", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
        });

        saveRes = MockResponseWithCookies();

        const jwtCookie = jwt.sign(
            {
            id: 5,
            csrfToken: "badToken",
            },
            "badSecret",
            {
            expiresIn: "1h",
            },
        );

        req.cookies = {
            jwt: jwtCookie,
        };

        await waitForRouteHandlerCompletion(
            jwtMiddleware,
            req,
            saveRes,
        );

        expect(saveRes.statusCode).toBe(401);
    });

    it("63. Returns a 401 if the JWT is valid but the CSRF token isn't", async () => {
    const req = httpMocks.createRequest({
        method: "POST",
    });

    saveRes = MockResponseWithCookies();

    const jwtCookie = jwt.sign(
        {
        id: 5,
        csrfToken: "badToken",
        },
        process.env.JWT_SECRET,
        {
        expiresIn: "1h",
        },
    );

    req.cookies = {
        jwt: jwtCookie,
    };

    if (!req.headers) {
        req.headers = {};
    }

    req.headers["X-CSRF-TOKEN"] = "goodToken";

    await waitForRouteHandlerCompletion(
        jwtMiddleware,
        req,
        saveRes,
    );

    expect(saveRes.statusCode).toBe(401);
});

it("64. Calls next if both the JWT and CSRF token are good", async () => {
  saveReq = httpMocks.createRequest({
    method: "POST",
  });

  saveRes = MockResponseWithCookies();

  const csrfToken = "goodToken";

  const jwtCookie = jwt.sign(
    {
      id: 5,
      csrfToken,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  saveReq.cookies = {
    jwt: jwtCookie,
  };

  if (!saveReq.headers) {
    saveReq.headers = {};
  }

  saveReq.headers["X-CSRF-TOKEN"] = csrfToken;

  const next = await waitForRouteHandlerCompletion(
    jwtMiddleware,
    saveReq,
    saveRes,
  );

  expect(next).toHaveBeenCalled();
});

it("65. A valid JWT sets req.user.id correctly", () => {
  expect(saveReq.user.id).toBe(5);
});

});


