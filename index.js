const cluster = require("cluster");
const { PORTS, REDIS_CREDS } = require("./config.js");
const { createApp: createLinApp } = require("./linearizable/app.js");
const { createLB: createLinLB } = require("./linearizable/main.js");
const { createApp: createSeqApp } = require("./sequential/app.js");
const { createLB: createSeqLB } = require("./sequential/main.js");
const { createApp: createEveApp } = require("./eventual/app.js");
const { createLB: createEveLB } = require("./eventual/main.js");
require("dotenv").config();

const args = process.argv.slice(2)[0];

// Check if the current process is the master process
if (cluster.isMaster) {
  if (args == "seq") createSeqLB(3000);
  else if (args == "lin") createLinLB(3000);
  else if (args == "eve") createEveLB(3000);

  const numCPUs = PORTS.length;

  // Fork workers equal to the number of CPUs / PORTS
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: PORTS[i],
      REDIS_CRED: JSON.stringify(REDIS_CREDS[PORTS[i]]),
    });
  }

  // Listen for when a worker exits and fork a new one
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  if (args == "seq")
    createSeqApp(process.env.PORT, JSON.parse(process.env.REDIS_CRED));
  else if (args == "lin")
    createLinApp(process.env.PORT, JSON.parse(process.env.REDIS_CRED));
  else if (args == "eve")
    createEveApp(process.env.PORT, JSON.parse(process.env.REDIS_CRED));
}
