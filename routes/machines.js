const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const bcrypt = require("bcrypt");
const cors = require("cors");

router.get("/", async (req, res) => {
  res.send("test");
});

module.exports = router;
