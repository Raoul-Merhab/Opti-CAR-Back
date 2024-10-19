const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { verifyToken, verifyRole } = require("../middlewares/jwt");

router.get("/", verifyToken, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        roleId: req.user.roleId,
      },
    });
    res.status(200).json({
      message: "Tasks retrieved successfully",
      tasks,
    });
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    res.status(402).json({ error: "Failed to retrieve tasks" });
  }
});

router.post("/complete", verifyToken, async (req, res) => {
  try {
    const { id } = req.body;
    const task = await prisma.task.update({
      where: { id },
      data: {
        isCompleted: true,
        completedBy: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });
    res.status(200).json({
      message: "Task completed successfully",
      task,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(402).json({ error: "Failed to complete task" });
  }
});

module.exports = router;
