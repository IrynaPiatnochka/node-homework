const express = require("express");
const dogs = require("../dogData");
const { ValidationError, NotFoundError } = require("../errors");

const router = express.Router();

router.get("/dogs", (req, res) => {
  return res.status(200).json(dogs);
});


router.post("/adopt", (req, res, next) => {
  try {
    const { name, email, dogName } = req.body;

    if (!name || !email || !dogName) {
      throw new ValidationError("Missing required fields");
    }

    const dog = dogs.find((d) => d.name === dogName);

    if (!dog || dog.status !== "available") {
      throw new NotFoundError("Dog not found or not available");
    }

    return res.status(201).json({
      message: `Adoption request received. We will contact you at ${email} for further details.`,
      application: {
        name,
        email,
        dogName,
        applicationId: Date.now(),
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/error", (req, res, next) => {
  return next(new Error("Test error"));
});

module.exports = router;

 
