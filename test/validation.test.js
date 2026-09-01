const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");


describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob",
        email: "bob@sample.com",
        password: "password",
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "password"),
    ).toBeDefined();
  });

  it("2. requires an email to be specified", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob",
        password: "Password1!",
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "email"),
    ).toBeDefined();
  });

  it("3. does not accept an invalid email", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob",
        email: "not-an-email",
        password: "Password1!",
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "email"),
    ).toBeDefined();
  });

  it("4. requires a password", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob",
        email: "bob@sample.com",
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "password"),
    ).toBeDefined();
  });

  it("5. requires a name", () => {
    const { error } = userSchema.validate(
      {
        email: "bob@sample.com",
        password: "Password1!",
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "name"),
    ).toBeDefined();
  });

  it("6. requires the name to be between 3 and 30 characters", () => {
    const { error } = userSchema.validate(
      {
        name: "Bo",
        email: "bob@sample.com",
        password: "Password1!",
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "name"),
    ).toBeDefined();
  });

  it("7. returns a falsy error for a valid user object", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob",
        email: "bob@sample.com",
        password: "Password1!",
      },
      { abortEarly: false },
    );

    expect(error).toBeFalsy();
  });
});

describe("task object validation tests", () => {
  it("8. requires a title", () => {
    const { error } = taskSchema.validate(
      {
        isCompleted: false,
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "title"),
    ).toBeDefined();
  });

  it("9. requires isCompleted to be valid when specified", () => {
    const { error } = taskSchema.validate(
      {
        title: "Test task",
        isCompleted: "not valid",
      },
      { abortEarly: false },
    );

    expect(
      error.details.find((detail) => detail.context.key === "isCompleted"),
    ).toBeDefined();
  });

  it("10. provides false as the default isCompleted value", () => {
    const { value } = taskSchema.validate({
        title: "Test task",
      });

    expect(value.isCompleted).toBe(false);
  });

  it("11. keeps isCompleted true when true is provided", () => {
    const { value } = taskSchema.validate(
      {
        title: "Test task",
        isCompleted: true,
      },
      { abortEarly: false },
    );

    expect(value.isCompleted).toBe(true);
  });
});

describe("patch task object validation tests", () => {
  it("12. does not require a title", () => {
    const { error } = patchTaskSchema.validate(
      {
        isCompleted: true,
      },
      { abortEarly: false },
    );

    expect(error).toBeFalsy();
  });

  it("13. leaves isCompleted undefined when it is not provided", () => {
    const { value } = patchTaskSchema.validate(
      {
        title: "Updated task",
      },
      { abortEarly: false },
    );

    expect(value.isCompleted).toBeUndefined();
  });
});

