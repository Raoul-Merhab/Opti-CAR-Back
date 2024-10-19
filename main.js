const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const machines = require("./routes/machines");
const auth = require("./routes/auth");

const PORT = 8080;

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
});

app.use("/machines", machines);
app.use("/auth", auth);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
