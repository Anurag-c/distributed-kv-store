const express = require("express");
const { TOM_PORT } = require("./config");
const http = require("http");
const socketIo = require("socket.io");
const { randomSleep } = require("./utils");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Handle socket connection
io.on("connection", (socket) => {
  console.log(`APP-${socket.id} connected to TOM server`);

  socket.on("broadcast", async (data) => {
    console.log(`broadcast request recieved from App:${data.senderAppId}`);
    await randomSleep(1000); // random delay for sending broadcast messages
    io.emit("message", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`APP-${socket.id} Disconnected from TOM server`);
  });
});

// Start the server
server.listen(TOM_PORT, () => {
  console.log(`TOM server running on port ${TOM_PORT}`);
});
