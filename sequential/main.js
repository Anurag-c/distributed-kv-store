const express = require("express");
const http = require("http");
const ioServer = require("socket.io");
const ioClient = require("socket.io-client");
const morgan = require("morgan");
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
  });

  app.use(express.json());
  app.use(morgan("dev"));

  // Define a route for the homepage
  app.get("/", (req, res) => {
    res.send("Hello, World!");
  });

  app.get("/api/get", async (req, res) => {
    let to = await setReqNum((reqNum + 1) % servers);
    if (req.query.id != undefined) to = Number(req.query.id);
    const redirectURL = `http://localhost:${PORTS[to]}/api/get/${req.query.key}`;
    console.log(`Redirecting to: ${redirectURL}`);
    res.redirect(redirectURL);
  });

  // Define a route for handling 404 errors
  app.use((req, res) => {
    res.status(404).send("Sorry, can't find that!");
  });

  // Socket server to handle set requests
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
  });

  httpServer.listen(PORT, () => {
    console.log(`Load balancer is running on http://localhost:${PORT}`);
  });

  return app;
}

module.exports = { createLB };
