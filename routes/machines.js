const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const bcrypt = require("bcrypt");
const cors = require("cors");
const { connect } = require("net");

router.post("/", async (req, res) => {
  try {
    const { machine, type } = req.body;

    const newMachine = await prisma.machine.create({
      data: {
        machine_id: machine,
        machineType: {
          connect: {
            name: type,
          },
        },
      },
    });

    res.status(201).json({
      message: "Machine added successfully",
      machine: newMachine,
    });
  } catch (error) {
    console.error("Error adding machine:", error);
    res.status(500).json({ error: "Failed to add machine" });
  }
});

module.exports = router;
