const logger = require('../utils/logger');

function evaluateExpression(expr) {
    // Basic security check to prevent malicious code execution
    if (!/^[0-9+\-*/(). ]+$/.test(expr)) {
        throw new Error('Invalid expression');
    }
    return eval(expr);
}

module.exports = {
    command: '!calc',
    description: 'Calculate mathematical expressions',
    execute: async (msg, args) => {
        try {
            if (!args.length) {
                return msg.reply('Please provide an expression. Example: !calc 2 + 2');
            }

            const expression = args.join(' ');
            const result = evaluateExpression(expression);
            await msg.reply(`🔢 ${expression} = ${result}`);
        } catch (error) {
            logger.error(`Calculator Error: ${error.message}`);
            await msg.reply('Invalid expression. Please use basic arithmetic operators (+, -, *, /)');
        }
    }
};
