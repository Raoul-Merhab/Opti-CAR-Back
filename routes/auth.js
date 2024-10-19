const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const SECRET = "aniss_daghyoul";

router.post("/signup", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const crypted_password = await bcrypt.hash(req.body.password, salt);
  const { id, email } = await prisma.user.create({
    data: {
      email: req.body.email,
      role: req.body.role,
      password: crypted_password,
      name: req.body.name,
    },
  });
  const access_token = jwt.sign({ id }, SECRET, { expiresIn: "3 hours" });
  res.send({ id, email, token: access_token });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).send({ error: "Mayexistich gae" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ error: "Password ghalet" });
    }
    const access_token = jwt.sign({ id: user.id }, SECRET, {
      expiresIn: "3 hours",
    });

    res.send({
      id: user.id,
      email: user.email,
      token: access_token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ error: "An error occurred during login" });
  }
});

module.exports = router;
