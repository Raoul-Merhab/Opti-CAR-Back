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

function getRandomInt(max) {
  return 1 + Math.floor(Math.random() * max);
}

const wss = new WebSocket.Server({ port: 8000 });

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
  const api = queryApi();
  console.log("getData", machine_id, from);
  const fluxQuery = `from(bucket: "testOuanes")
  |> range(start: ${from}, stop: now())
  |> filter(fn: (r) => r["_measurement"] == "machine_data")
  |> filter(fn: (r) => r["machine_id"] == "${machine_id}")
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> yield(name: "last")`;

  let result = [];

  for await (const { values, tableMeta } of api.iterateRows(fluxQuery)) {
    const o = tableMeta.toObject(values);
    result.push(o);
  }
  if (result.length > 100) {
    console.log("result.length", result.length);
    const n = Math.ceil(result.length / 100);
    result = result.filter((value, index) => {
      return index % n === 0;
    });
    console.log("result.length 2", result.length);
    return result;
  }
  return result;
};

router.post("/", verifyToken, async (req, res) => {
  console.log("GET /data");
  const { from, machine_id } = req.body;
  await getData(machine_id, from).then((data) => {
    res.send(data);
  });
});

router.post("/webhook", async (req, res) => {
  console.log("hh");
  const { machine_id, ...data } = req.body;
  if (!machine_id || !data) {
    return res.status(400).send("Invalid request");
  }

  const seuils = await prisma.machineSeuil.findMany({
    where: {
      machineId: machine_id,
    },
    include: {
      limitName: true,
    },
  });

  let alertGenerated = false;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "number") {
      const seuil = seuils.find((s) => s.limitName.name === key);
      if (seuil) {
        if (
          (value < seuil.minValue || value > seuil.maxValue) &&
          Math.random() > 0.97
        ) {
          alertGenerated = true;

          const newAlert = await prisma.alert.create({
            data: {
              name: `Seuil dépassé pour ${key} sur la machine ${machine_id}`,
              status: false,
              criticality: getRandomInt(3),
              machine: {
                connect: {
                  machine_id: machine_id,
                },
              },
            },
          });
        }
      }
    }
  }
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
    const api = writeApi();
    api.writePoint(point);
    console.log("closing ...");
    await api.flush();
    await api.close();
    await getData(machine_id, "-4m").then((data) => {
      wss.clients.forEach((client) => {
        client.send(data);
      });
    });

    res.status(200).send("Data written successfully");
  } catch (error) {
    console.error("Error writing data to InfluxDB", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
