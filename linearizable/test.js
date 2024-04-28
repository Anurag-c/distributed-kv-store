const ioClient = require("socket.io-client");
const { sleep } = require("../utils");

const userLogs1 = [];
const userLogs2 = [];
const userLogs3 = [];
const userLogs4 = [];

async function user1() {
  const user1 = ioClient("http://localhost:3000");
  user1.on("set-response", (data) => {
    userLogs1.push(data);
  });
  user1.on("get-response", (data) => {
    userLogs1.push(data);
  });

  user1.emit("get", { key: "fruit", id: 0 });
  user1.emit("set", { key: "fruit", value: "apple", id: 0, delay: 10 });
  user1.emit("set", { key: "fruit", value: "mango", id: 1 });
  user1.emit("set", { key: "fruit", value: "banana", id: 2 });
  user1.emit("get", { key: "fruit", id: 0 });
  user1.emit("get", { key: "fruit", id: 0, delay: 20 });
}

async function user2() {
  const user2 = ioClient("http://localhost:3000");
  user2.on("set-response", (data) => {
    userLogs2.push(data);
  });
  user2.emit("set", { key: "fruit", value: "mango" });
}

async function user3() {
  const user3 = ioClient("http://localhost:3000");
  user3.on("get-response", (data) => {
    userLogs3.push(data);
  });
  for (let i = 0; i < 5; i++) {
    user3.emit("get", { key: "fruit" });
    await sleep(1000);
  }
}

async function user4() {
  const user4 = ioClient("http://localhost:3000");
  user4.on("get-response", (data) => {
    userLogs4.push(data);
  });
  for (let i = 0; i < 5; i++) {
    user4.emit("get", { key: "fruit" });
    await sleep(1000);
  }
}

async function test1() {
  const executes = [user1()];
  console.log("************ Running Test 1: ***************");
  console.log("Please wait 10 seconds to process all the requests");
  await Promise.all(executes);
  await sleep(10000);
}

test1().then(() => {
  console.log("user 1 logs: ", userLogs1);
  /*
  console.log("user 2 logs: ", userLogs2);
  console.log("user 3 logs: ", userLogs3);
  console.log("user 4 logs: ", userLogs4);
  */
  console.log("************ Test 1 Completed ***************");
});
