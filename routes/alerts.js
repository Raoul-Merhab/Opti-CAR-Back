const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { verifyToken, verifyRole } = require("../middlewares/jwt");

router.post("/", async (req, res) => {
  const { alert_data } = req.body;

  const alert = await prisma.alert.create({
    data: {
      alert_data: alert_data,
    },
  });
});

router.get("/", async (req, res) => {
  const alerts = await prisma.alert.findMany();
  res.send(alerts);
});

module.exports = router;
