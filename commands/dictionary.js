const axios = require('axios');
const logger = require('../utils/logger');

module.exports = {
    command: '!define',
    description: 'Look up word definitions',
    execute: async (msg, args) => {
        try {
            if (!args.length) {
                return msg.reply('Please provide a word to look up. Example: !define hello');
            }

            const word = args[0].toLowerCase();
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            const entry = response.data[0];
            let definition = `📚 *${word}*\n\n`;
            
            entry.meanings.slice(0, 3).forEach(meaning => {
                definition += `*${meaning.partOfSpeech}*\n`;
                meaning.definitions.slice(0, 2).forEach((def, index) => {
                    definition += `${index + 1}. ${def.definition}\n`;
                });
                definition += '\n';
            });

            await msg.reply(definition);
        } catch (error) {
            logger.error(`Dictionary Error: ${error.message}`);
            await msg.reply('Could not find definition for that word.');
        }
    }
};
