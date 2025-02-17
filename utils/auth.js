const config = require('../config');
const rateLimit = new Map();

module.exports = {
    isAdmin: (number) => config.adminNumbers.includes(number),
    
    checkRateLimit: (from) => {
        const now = Date.now();
        const window = 60 * 1000; // 1 minute
        const limit = 10; // 10 requests per minute
        
        const entries = rateLimit.get(from) || [];
        const validEntries = entries.filter(timestamp => now - timestamp < window);
        
        if (validEntries.length >= limit) return false;
        
        rateLimit.set(from, [...validEntries, now]);
        return true;
    }
};