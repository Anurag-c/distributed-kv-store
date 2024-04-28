const { createClient } = require("redis");

async function createRedisClient(REDIS_CRED) {
  const client = createClient(REDIS_CRED);

  client.on("error", (err) => {
    console.error("Redis error:", err);
  });

  await client.connect();

  return client;
}

module.exports = { createRedisClient };
