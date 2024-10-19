const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
router.use(express.json());
const bcrypt = require("bcrypt");
const cors = require("cors");
const { verifyToken, verifyRole } = require("../middlewares/jwt");
const { queryApi, writeApi, Point } = require("../influxdb-config");
const WebSocket = require("ws");
const { log } = require("console");
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log("Received message =>", message);
    ws.send("Message received");
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const getData = async (machine_id, from) => {
  console.log("getData", machine_id, from);
  const fluxQuery = `from(bucket: "testOuanes")
  |> range(start: ${from},stop:now())
  |> filter(fn: (r) => r["_measurement"] == "machine_data")
  |> filter(fn: (r) => r["machine_id"] == "${machine_id}")
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> yield(name: "last")`;

  let result = [];
  for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
    const o = tableMeta.toObject(values);
    delete o._start;
    delete o._stop;
    print(o);
    result.push(o);
  }
  return result;
};

router.get("/", verifyToken, async (req, res) => {
  console.log("GET /data");

  const { from, machine_id } = req.body;

  res.send(await getData(machine_id, from));
});

router.post("/webhook", async (req, res) => {
  console.log("hh");

  const { machine_id, ...data } = req.body;
  if (!machine_id || !data) {
    return res.status(400).send("Invalid request");
  }
  console.log(machine_id);
  console.log(data);
  //
  const point = new Point("machine_data")
    .tag("machine_id", machine_id)
    .timestamp(new Date());
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "number") {
      point.floatField(key, value);
    } else if (typeof value === "string") {
      point.stringField(key, value);
    }
  }

  try {
    writeApi.writePoint(point);
    console.log("closing ...");
    await writeApi.flush();
    await writeApi.close();
    // wss.clients.forEach((client) => {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(getData("welding_robot_006", "-1h"));
    //   }
    // });
    res.status(200).send("Data written successfully");
  } catch (error) {
    console.error("Error writing data to InfluxDB", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
