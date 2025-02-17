const queryChatbotService = require('../services/query.js');

module.exports = {
    command: '!query',
    description: 'Get answer for any query',
    execute: async (msg, args) => {
        try {
            // Join arguments to form the complete query
            const query = args.join(' ');
            
            if (!query) {
                return msg.reply('Please provide a query. Example: !query how many grams of proteins in 1 egg');
            }

            const response = await queryChatbotService.getAnswer(query);
            
            if (!response.status) {
                return msg.reply('Sorry, I couldn\'t process your query. Please try again.');
            }

            // Format the response for WhatsApp
            // Replace markdown formatting if needed for WhatsApp compatibility
            let formattedResponse = response.result
                .replace(/\*/g, '•') // Replace markdown bold with bullet points
                .replace(/_/g, ''); // Remove markdown italics

            // Add emoji and formatting for WhatsApp

            await msg.reply(formattedResponse);
        } catch (error) {
            console.error('Query command error:', error);
            await msg.reply('Sorry, I encountered an error. Please try again later.');
        }
    }
};