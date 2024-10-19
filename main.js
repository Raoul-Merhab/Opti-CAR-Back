const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const machines = require("./routes/machines");
const auth = require("./routes/auth");
const data = require("./routes/data");
const tasks = require("./routes/tasks");
const alerts = require("./routes/alerts");

const { InfluxDB } = require("@influxdata/influxdb-client");

const PORT = 5424;

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
app.use("/data", data);
app.use("/tasks", tasks);
app.use("/alerts", alerts);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
