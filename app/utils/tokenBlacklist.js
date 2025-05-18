const redis = require("../configs/redis.config");
const jwt = require("jsonwebtoken");
const addTokenToBlacklist = async (token, key) => {
  try{
    const decoded = jwt.verify(token, key);
    if(!decoded.exp) {
      return;
    }
    const expireInSec = decoded.exp - Math.floor(Date.now() / 1000);
    if(expireInSec > 0) {
      await redis.set(token, "blacklisted", "EX", expireInSec);
    }
  }catch (error) {
    console.error("Error adding token to blacklist:", error);
    return {error: "Error adding token to blacklist"};
  }
};

const isBlacklisted = async (token) => {
  try{
    const result = await redis.get(token);
    return result === "blacklisted";
  }catch (error) {
    console.error("Error checking token blacklist:", error);
    return {error: "Error checking token blacklist"};
  }
}

module.exports = {
    addTokenToBlacklist,
    isBlacklisted
}