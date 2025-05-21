const redis = require("../configs/redis.config");
const generateItemCode = async (item_type="") => {
    try {
        const prefix = item_type.includes('Material') ? "NL" : "SP";
        const key = `item_code_${prefix}`;
        const seq = await redis.incr(key);
        const paddedSeq = String(seq).padStart(6, '0');
        return `${prefix}${paddedSeq}`;
    } catch (error) {
        return { error: error.message };
    }
};

module.exports = {
    generateItemCode
};