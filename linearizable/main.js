const express = require("express");
const http = require("http");
const ioServer = require("socket.io");
const ioClient = require("socket.io-client");
const { PORTS } = require("../config.js");
const { sleep } = require("../utils.js");

function createLB(PORT) {
  let reqNum = -1;
  const servers = PORTS.length;
  const app = express();
  const httpServer = http.createServer(app);
  const io = ioServer(httpServer);

  async function setReqNum(newReqNum) {
    reqNum = newReqNum;
    return reqNum;
  }

  app.use(express.json());

  // Make connections with all nodes
  const socketClients = PORTS.map((port) => {
    return ioClient(`http://localhost:${port}`);
  });

  socketClients.forEach((socket, index) => {
    socket.on("connect", () => {
      console.log(`Load balancer socket connected to App:${PORTS[index]}`);
    });

    socket.on("disconnect", () => {
      console.log(`Load balancer socket disconnected from APP:${PORTS[index]}`);
    });

    // Listen for set-response event from application server
    socket.on("set-response", (data) => {
      const userSocketId = data.userId;
      if (userSocketId) {
        console.log(`SET request from user:${userSocketId} completed: `, data);
        io.to(userSocketId).emit("set-response", {
          message: data.message,
          performedBy: `Request performed by App:${data.initiator}`,
        });
      }
    });

    // Listen for get-response event from application server
    socket.on("get-response", (data) => {
      const userSocketId = data.userId;
      if (userSocketId) {
        console.log(`GET request from user:${userSocketId} completed: `, data);
        io.to(userSocketId).emit("get-response", {
          key: data.key,
          value: data.value,
          message: data.message,
          performedBy: `Request performed by App:${data.initiator}`,
        });
      }
    });
  });

  // Socket server to handle set and get requests
  io.on("connection", (socket) => {
    console.log("A client connected to load balancer, Id: ", socket.id);

    socket.on("disconnect", () => {
      console.log("A client disconnected from load balancer, Id: ", socket.id);
    });

    socket.on("set", async (data) => {
      console.log(`SET recieved on load balancer from user: ${socket.id}`);
      let to = await setReqNum((reqNum + 1) % servers);
      if (data.id != undefined) to = Number(data.id);

      const sockClient = socketClients[to];
      data.userId = socket.id;
      console.log(`Redirecting SET to: ${sockClient.io.uri}`);

      if (data.delay) {
        await sleep(data.delay);
      }

      sockClient.emit("set", data);
    });

    socket.on("get", async (data) => {
      console.log(`GET recieved on load balancer from user: ${socket.id}`);
      let to = await setReqNum((reqNum + 1) % servers);
      if (data.id != undefined) to = Number(data.id);

      const sockClient = socketClients[to];
      data.userId = socket.id;
      console.log(`Redirecting GET to: ${sockClient.io.uri}`);

      if (data.delay) {
        await sleep(data.delay);
      }

      sockClient.emit("get", data);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Load balancer is running on http://localhost:${PORT}`);
  });

  return app;
}

module.exports = { createLB };
