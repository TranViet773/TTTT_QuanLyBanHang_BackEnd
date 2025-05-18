// redis.js
const Redis = require("ioredis");
const redis = new Redis(); // default: localhost:6379
module.exports = redis;