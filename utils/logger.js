const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
};

module.exports = {
    info: (message) => console.log(`${colors.info}[INFO] ${message}${colors.reset}`),
    success: (message) => console.log(`${colors.success}[SUCCESS] ${message}${colors.reset}`),
    warn: (message) => console.log(`${colors.warn}[WARN] ${message}${colors.reset}`),
    error: (message) => console.log(`${colors.error}[ERROR] ${message}${colors.reset}`)
};