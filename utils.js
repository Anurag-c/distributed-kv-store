function randomSleep(ms) {
  const randomDelay = Math.floor(Math.random() * ms);
  return new Promise((resolve) => setTimeout(resolve, randomDelay));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { randomSleep, sleep };
