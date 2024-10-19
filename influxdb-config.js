const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const url = "http://localhost:8086";
const token =
  "nBjcKX1GyXj2Mq2C27bhCHChvIZuUeUN7rb8l3SrxE5HaIjVNAIpTaMCc96QKlv0mM-r6_HSjg9EJzH9Xjm3qw==";
const org = "DevFest";
const bucket = "testOuanes";

const dbServer = new InfluxDB({ url, token });

const queryApi = () => {
  return dbServer.getQueryApi(org);
};
const writeApi = () => {
  return dbServer.getWriteApi(org, bucket);
};

module.exports = { queryApi, writeApi, Point };
