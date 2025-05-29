const TransactionManager = require('../services/transactionManager');
const config = require('../config'); // Added config require

module.exports = {
  command: '!fund-transfer',
  description:
    'Transfer fund to another user (usage: !fund-transfer [phone_number] [amount])',
  execute: async (msg, args) => {
    try {
      // Updated admin check logic
      const senderId = msg.from.split('@')[0];
      if (!config.adminNumbers.includes(senderId)) {
        return msg.reply('🔒 This command is for admins only');
      }

      if (args.length < 2) {
        return msg.reply(
          'Invalid format. Usage: !fund-transfer [phone_number] [amount]\nExample: !fund-transfer 9864461540 10'
        );
      }

      const recipientNumber = args[0];
      const amount = parseFloat(args[1]);
      // Validate phone number format (assuming Nepal phone number format)
      if (!recipientNumber.match(/^9\d{9}$/)) {
        return msg.reply(
          '❌ Invalid phone number format. Please enter a valid 10-digit number starting with 9'
        );
      }

      // Validate amount
      if (isNaN(amount) || amount <= 0) {
        return msg.reply('❌ Please enter a valid amount greater than 0');
      }

      const result = await TransactionManager.transferFund(
        recipientNumber,
        amount
      );
      msg.reply(
        `✅ ${result.detail}\nAvailable Balance: Rs. ${result.balance}`
      );
    } catch (error) {
      console.error(error);
      msg.reply(`❌ Transfer failed: ${error.message}`);
    }
  },
};
