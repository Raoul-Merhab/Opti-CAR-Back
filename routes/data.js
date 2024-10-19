const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const bcrypt = require("bcrypt");
const cors = require("cors");
const { connect } = require("net");

router.post("/", async (req, res) => {
  res.status(200).send({ message: "Data endpoint" });
});

module.exports = router;
