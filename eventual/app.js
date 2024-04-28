const express = require("express");
const http = require("http");
const ioServer = require("socket.io");
const morgan = require("morgan");
const { createRedisClient } = require("../redisClient.js");
const { tomController } = require("../tomController.js");

// Creating an Express application
async function createApp(PORT, REDIS_CRED) {
  const app = express();
  const redisClient = await createRedisClient(REDIS_CRED);
  const httpServer = http.createServer(app);
  const io = ioServer(httpServer);
  const tom = tomController(PORT, handleWrite);

  app.use(express.json());
  // Define a custom token function for Morgan to skip logging for Socket.IO requests
  morgan.token("skipSocketLog", function (req, res) {
    return req.url.startsWith("/socket.io/") ? "skip" : null;
  });

  // Use the custom token function in Morgan
  app.use(
    morgan(":skipSocketLog", {
      skip: (req, res) => req.url.startsWith("/socket.io/"),
    })
  );

  async function handleWrite(data) {
    const { key, value } = data;

    let message = "";
    if (!key || !value) {
      message = "send a key/value pair";
    } else {
      try {
        await redisClient.set(key, value);
        console.log(`key/value pair stored successfully on App:${PORT}`);
        message = `key/value pair stored successfully on App:${PORT}`;
      } catch (err) {
        console.error(err);
        message = err.message;
      }
    }

    return { ...data, message };
  }

  // Define a route for the homepage
  app.get("/", (req, res) => {
    res.send("Hello, World!");
  });

  app.get("/api/get/:key", async (req, res) => {
    const { key } = req.params;

    if (!key) {
      res.status(400).json({
        message: "mention the key",
      });
    }

    try {
      const value = await redisClient.get(key);
      res.status(200).json({
        key,
        value,
        performedBy: `Request performed by App:${PORT}`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: err.message,
        performedBy: `Request performed by App:${PORT}`,
      });
    }
  });

  app.post("/api/set", async (req, res) => {
    const { key, value } = req.body;
    const result = await handleWrite(req.body);
    tom.broadcast({
      event: "set",
      key,
      value,
    });

    res.status(200).json({
      message: result.message,
      performedBy: `Request performed by App:${PORT}`,
    });
  });

  // Define a route for handling 404 errors
  app.use((req, res) => {
    res.status(404).send("Sorry, can't find that!");
  });

  // Socket server to handle set requests
  io.on("connection", (socket) => {
    console.log(`A client connected to App:${PORT}`);

    socket.on("disconnect", () => {
      console.log(`A client disconnected from App:${PORT}`);
    });

    socket.on("set", async (data) => {
      console.log(`SET recieved from load balancer on App:${PORT}`);
      const res = await handleWrite(data);
      socket.emit("set-response", { ...res, userId: data.userId });
      tom.broadcast({
        event: "set",
        key: data.key,
        value: data.value,
      });
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  return app;
}

module.exports = { createApp };
