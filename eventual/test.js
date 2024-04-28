const axios = require("axios");
const { sleep } = require("../utils");

const userLogs1 = [];
const userLogs2 = [];
const userLogs3 = [];
const userLogs4 = [];
const userLogs5 = [];

async function user1() {
  const res = await axios.post("http://localhost:3000/api/set", {
    key: "vehicle",
    value: "bike",
    id: 0,
  });

  userLogs1.push(res.data);
}

async function user2() {
  const res = await axios.post("http://localhost:3000/api/set", {
    key: "vehicle",
    value: "car",
    id: 1,
  });

  userLogs2.push(res.data);
}

async function user3() {
  for (let i = 0; i < 5; i++) {
    const res = await axios.get("http://localhost:3000/api/get", {
      params: {
        key: "vehicle",
        id: 0,
      },
    });
    userLogs3.push(res.data);
    await sleep(500);
  }
}

async function user4() {
  for (let i = 0; i < 5; i++) {
    const res = await axios.get("http://localhost:3000/api/get", {
      params: {
        key: "vehicle",
        id: 1,
      },
    });
    userLogs4.push(res.data);
    await sleep(500);
  }
}

async function user5() {
  for (let i = 0; i < 5; i++) {
    const res = await axios.get("http://localhost:3000/api/get", {
      params: {
        key: "vehicle",
        id: 2,
      },
    });
    userLogs5.push(res.data);
    await sleep(500);
  }
}

async function test1() {
  const executes = [user1(), user2(), user3(), user4(), user5()];
  console.log("************ Running Test 1: ***************");
  await Promise.all(executes);
}

test1().then(() => {
  console.log("user 1 logs: ", userLogs1);
  console.log("user 2 logs: ", userLogs2);
  console.log("user 3 logs: ", userLogs3);
  console.log("user 4 logs: ", userLogs4);
  console.log("user 5 logs: ", userLogs5);
  console.log("************ Test 1 Completed ***************");
});
