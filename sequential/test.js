const ioClient = require("socket.io-client");
const axios = require("axios");
const { sleep } = require("../utils");

const userLogs1 = [];
const userLogs2 = [];
const userLogs3 = [];
const userLogs4 = [];
const userLogs5 = [];

async function user1() {
  const user1 = ioClient("http://localhost:3000");

  // 1) Make a SET request to replica 3001
  user1.on("set-response", async (data) => {
    userLogs1.push(data);
  });
  user1.emit("set", { key: "name", value: "batman", id: 0 });
  userLogs1.push("SET request sent with key: name and value: batman");

  // 2) Make a GET request to replica 3002 before SET response is received from 3001
  userLogs1.push("GET request sent with key: name");
  const res = await axios.get("http://localhost:3000/api/get", {
    params: { key: "name", id: 1 },
  });
  userLogs1.push(res.data);
}

async function user2() {
  const user2 = ioClient("http://localhost:3000");
  user2.on("set-response", async (data) => {
    userLogs2.push(data);
  });
  user2.emit("set", { key: "name", value: "superman", id: 0 });
  userLogs2.push("SET request sent with key: name and value: superman");

  userLogs2.push("GET request sent with key: name");
  const res = await axios.get("http://localhost:3000/api/get", {
    params: { key: "name", id: 1 },
  });
  userLogs2.push(res.data);
}

async function user3() {
  for (let i = 0; i < 5; i++) {
    const res = await axios.get("http://localhost:3000/api/get", {
      params: { key: "name", id: 0 },
    });
    userLogs3.push(res.data);
    await sleep(600);
  }
}

async function user4() {
  for (let i = 0; i < 5; i++) {
    const res = await axios.get("http://localhost:3000/api/get", {
      params: { key: "name", id: 1 },
    });
    userLogs4.push(res.data);
    await sleep(600);
  }
}

async function user5() {
  for (let i = 0; i < 5; i++) {
    const res = await axios.get("http://localhost:3000/api/get", {
      params: { key: "name", id: 2 },
    });
    userLogs5.push(res.data);
    await sleep(700);
  }
}

async function test1() {
  const executes = [user1(), user2(), user3(), user4(), user5()];
  console.log("************ Running Test 1: ***************");
  await Promise.all(executes);
  await sleep(5000);
}

test1().then(() => {
  console.log("user 1 logs: ", userLogs1);
  console.log("user 2 logs: ", userLogs2);
  console.log("user 3 logs: ", userLogs3);
  console.log("user 4 logs: ", userLogs4);
  console.log("user 5 logs: ", userLogs5);
  console.log("************ Test 1 Completed ***************");
});
