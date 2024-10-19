const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const bcrypt = require("bcrypt");
const cors = require("cors");
const { verifyToken, verifyRole } = require("../middlewares/jwt");

router.post("/", verifyToken, async (req, res) => {
  try {
    const { machineName, machineType, machineThresholds } = req.body;

    // Step 1: Create the machine
    const newMachine = await prisma.machine.create({
      data: {
        machine_id: machineName,
        machineType: {
          connect: {
            name: machineType,
          },
        },
      },
    });

    // Step 2: Handle machine thresholds
    if (machineThresholds && Object.keys(machineThresholds).length > 0) {
      // Loop through each threshold entry in machineThresholds
      for (const [sensorName, { min, max }] of Object.entries(
        machineThresholds
      )) {
        // Check if the sensor already exists in MachineSensor
        let sensor = await prisma.machineSensor.findUnique({
          where: { name: sensorName },
        });

        // If the sensor doesn't exist, create it
        if (!sensor) {
          res.status(400).json({
            error: `Sensor ${sensorName} not found`,
          });
        }

        // Create MachineSeuil (threshold) for the machine
        await prisma.machineSeuil.create({
          data: {
            machine: {
              connect: {
                machine_id: newMachine.machine_id,
              },
            },
            minValue: min,
            maxValue: max,
            limitName: {
              connect: {
                id: sensor.id,
              },
            },
          },
        });
      }
    }

    res.status(201).json({
      message: "Machine and thresholds added successfully",
      machine: newMachine,
    });
  } catch (error) {
    console.error("Error adding machine:", error);
    res.status(500).json({ error: "Failed to add machine" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  console.log("GET /machines");
  console.log(req.user);

  try {
    const machines = await prisma.machine.findMany({
      include: {
        machineType: true,
      },
    });

    res.status(200).json({
      message: "Machines retrieved successfully",
      machines,
    });
  } catch (error) {
    console.error("Error retrieving machines:", error);
    res.status(402).json({ error: "Failed to retrieve machines" });
  }
});

module.exports = router;
