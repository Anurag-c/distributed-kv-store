const express = require("express");
const http = require("http");
const ioServer = require("socket.io");
const { createRedisClient } = require("../redisClient.js");
const { tomController } = require("../tomController.js");

async function createApp(PORT, REDIS_CRED) {
  const app = express();
  const redisClient = await createRedisClient(REDIS_CRED);
  const httpServer = http.createServer(app);
  const io = ioServer(httpServer);
  const tom = tomController(PORT, handleWrite, handleRead);

  app.use(express.json());

  async function handleWrite(data) {
    const { key, value, initiator } = data;

    let message = "";
    if (!key || !value) {
      message = "send a key/value pair";
    } else {
      try {
        await redisClient.set(key, value);
        console.log(`key/value pair stored successfully on App:${PORT}`);
        message = `key/value pair stored successfully`;
      } catch (err) {
        console.error(err);
        message = err.message;
      }
    }

    if (initiator == PORT) {
      io.emit("set-response", { ...data, message });
    }
  }

  async function handleRead(data) {
    const { key, initiator } = data;

    let message = "";
    let value = null;
    if (!key) {
      message = "send a key";
    } else {
      try {
        value = await redisClient.get(key);
        console.log(`key retrieved successfully on App:${PORT}`);
        message = `key retrieved successfully`;
      } catch (err) {
        console.error(err);
        message = err.message;
      }
    }

    if (initiator == PORT) {
      io.emit("get-response", { ...data, value, message });
    }
  }

  // Socket server to handle set and get requests
  io.on("connection", (socket) => {
    console.log(`A client connected to App:${PORT}`);

    socket.on("disconnect", () => {
      console.log(`A client disconnected from App:${PORT}`);
    });

    socket.on("set", (data) => {
      console.log(`SET recieved from load balancer on App:${PORT}`);
      tom.broadcast({
        event: "set",
        key: data.key,
        value: data.value,
        userId: data.userId,
        initiator: PORT,
      });
    });

    socket.on("get", (data) => {
      console.log(`GET recieved from load balancer on App:${PORT}`);
      tom.broadcast({
        event: "get",
        key: data.key,
        userId: data.userId,
        initiator: PORT,
      });
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  return app;
}

module.exports = { createApp };
