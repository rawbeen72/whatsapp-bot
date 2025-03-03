const TransactionManager = require('../services/transactionManager');

module.exports = {
    command: '!load-fund',
    description: 'Load fund from bank (usage: !load-fund CITIZEN [amount])',
    execute: async (msg, args) => {
        try {
            if (args.length < 2) {
                return msg.reply('Invalid format. Usage: !load-fund CITIZEN [amount]\nExample: !load-fund CITIZEN 100');
            }

            const bankCode = args[0];
            const amount = parseFloat(args[1]);
            if (isNaN(amount)) return msg.reply('Please enter valid amount');

            await TransactionManager.initiateLoad(msg.from, amount, bankCode);
            msg.reply(`📲 OTP sent to your registered mobile number. Please verify with !load-otp [code]`);
        } catch (error) {
            console.log(error);
            msg.reply(`❌ Load failed: ${error.message}`);
        }
    }
};