const express = require("express");
const morgan = require("morgan");
const { PORTS } = require("../config.js");
const { default: axios } = require("axios");

function createLB(PORT) {
  let reqNum = -1;
  const servers = PORTS.length;
  const app = express();

  async function setReqNum(newReqNum) {
    reqNum = newReqNum;
    return reqNum;
  }

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

  app.post("/api/set", async (req, res) => {
    const { key, value, id } = req.body;
    let to = await setReqNum((reqNum + 1) % servers);
    if (id != undefined) to = Number(id);

    const redirectURL = `http://localhost:${PORTS[to]}/api/set/`;
    const body = {
      key,
      value,
    };

    console.log(`Redirecting to: ${redirectURL}`);
    const response = await axios.post(redirectURL, body);
    res.status(response.status).json(response.data);
  });

  // Define a route for handling 404 errors
  app.use((req, res) => {
    res.status(404).send("Sorry, can't find that!");
  });

  app.listen(PORT, () => {
    console.log(`Load balancer is running on http://localhost:${PORT}`);
  });

  return app;
}

module.exports = { createLB };
