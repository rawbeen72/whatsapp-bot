const TransactionManager = require('../services/transactionManager');

module.exports = {
    command: '!load_otp',
    description: 'Verify OTP for money load',
    execute: async (msg, args) => {
        try {
            if (args.length < 1) {
                return msg.reply('Usage: !load_otp [6-digit-code]\nExample: !load_otp 123456');
            }

            const result = await TransactionManager.verifyOTP(msg.from, args[0]);
            const response = `✅ ${result.detail}\n` +
                             `Amount: NPR ${result.amount}\n`;

            msg.reply(response);

        } catch (error) {
            console.log(error);
            msg.reply(`❌ Verification failed: ${error.message}`);
        }
    }
};