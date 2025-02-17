const axios = require('axios');
const { scheduleJob } = require('node-schedule');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = [{
    command: '!translate',
    description: 'Translate text',
    execute: async (msg, args) => {
        if (args.length < 2) return msg.reply('Usage: !translate [lang] [text]');
        
        try {
            const [lang, ...textParts] = args;
            const response = await axios.post(
                'https://translation.googleapis.com/language/translate/v2',
                { q: textParts.join(' '), target: lang },
                { params: { key: config.translateKey } }
            );
            msg.reply(response.data.data.translations[0].translatedText);
        } catch (error) {
            logger.error(`Translation Error: ${error.message}`);
            msg.reply("Translation failed");
        }
    }
}];