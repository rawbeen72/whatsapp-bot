const logger = require('../utils/logger');

// Store only the latest poll
let currentPoll = null;

module.exports = {
    command: '!poll',
    description: 'Create a poll (usage: !poll "question" "option1" "option2" ...)',
    execute: async (msg, args) => {
        try {
            const client = require("../index").client;
            const chat = await client.getChatById(msg.from);

            const fullText = args.join(' ');
            const matches = fullText.match(/"([^"]*)"/g);
            
            if (!matches || matches.length < 3) {
                return msg.reply('Please provide a question and at least 2 options in quotes.\nExample: !poll "Favorite color?" "Red" "Blue" "Green"');
            }

            const question = matches[0].replace(/"/g, '');
            const options = matches.slice(1).map(opt => opt.replace(/"/g, ''));
            
            const votes = new Map();
            options.forEach(opt => votes.set(opt, new Set()));

            currentPoll = {
                question,
                options,
                votes,
                voters: new Set()
            };

            let message = `📊 *Poll: ${question}*\n\n`;
            options.forEach((opt, index) => {
                message += `${index + 1}. ${opt}\n`;
            });
            await msg.reply(message);
        } catch (error) {
            logger.error(`Poll Error: ${error.message}`);
            await msg.reply('Failed to create poll');
        }
    }
};
