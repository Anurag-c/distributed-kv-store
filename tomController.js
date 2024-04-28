const { PORTS } = require("./config.js");
const { TOM_PORT } = require("./config.js");
const ioClient = require("socket.io-client");
const { randomUUID } = require("crypto");

function tomController(PORT, handleWrite, handleRead) {
  const tomClient = ioClient(`http://localhost:${TOM_PORT}`);
  const messageQueue = [];
  const acksMap = {};
  let timestamp = 0;

  function broadcast(data) {
    const { ack } = data;
    timestamp = timestamp + 1;

    if (ack) {
      data = {
        ...data,
        senderAppId: PORT,
        senderTimestamp: timestamp,
      };
    } else {
      data = {
        ...data,
        msgId: randomUUID(),
        senderAppId: PORT,
        senderTimestamp: timestamp,
      };
    }

    tomClient.emit("broadcast", data);
  }

  function sendAck(msgId) {
    broadcast({ msgId, ack: true });
  }

  async function handleDeliverMessage() {
    while (
      messageQueue.length > 0 &&
      acksMap[messageQueue[0].msgId] == PORTS.length
    ) {
      delete acksMap[messageQueue[0].id];
      const data = messageQueue.shift();
      if (data.event == "set") await handleWrite(data);
      else if (data.event == "get") await handleRead(data);
    }
  }

  async function handleIncomingMessage(data) {
    // console.log(`Broadcasted message recieved on App:${PORT} from App:${data.senderAppId}`);

    const { msgId, senderTimestamp, ack } = data;
    timestamp = Math.max(timestamp, senderTimestamp) + 1;

    if (ack) {
      if (acksMap.hasOwnProperty(msgId)) acksMap[msgId]++;
      else acksMap[msgId] = 1;
      await handleDeliverMessage();
      return;
    }

    messageQueue.push(data);
    messageQueue.sort((a, b) => {
      if (a.senderTimestamp === b.senderTimestamp) {
        return a.senderAppId.localeCompare(b.senderAppId);
      }
      return a.senderTimestamp - b.senderTimestamp;
    });

    sendAck(msgId);
  }

  tomClient.on("connect", () => {
    console.log(
      `socket client on port: ${PORT} connected to socket server on port: ${TOM_PORT}`
    );
  });

  tomClient.on("disconnect", () => {
    console.log(
      `socket client on port: ${PORT} disconnected from socket server on port: ${TOM_PORT}`
    );
  });

  tomClient.on("message", handleIncomingMessage);

  return {
    broadcast,
  };
}

module.exports = { tomController };
