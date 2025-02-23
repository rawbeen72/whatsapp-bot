const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = {
    command: '!gif',
    description: 'Send a random GIF based on a tag. Usage: !gif [tag]',
    execute: async (msg, args) => {
        const tag = args.length ? args.join(' ') : 'funny';
        try {
            const response = await axios.get('https://api.giphy.com/v1/gifs/random', {
                params: {
                    api_key: config.giphyAPIKey,
                    tag: tag
                }
            });
            console.log(response.data.data);
            if (!response.data.data || !response.data?.data?.images?.original?.url) {
                return msg.reply('No GIF found for that tag.');
            }
            const gifUrl = response.data.data.image_url;
            const media = await MessageMedia.fromUrl(gifUrl);
            await msg.reply(media);
        } catch (error) {
            logger.error(`GIF Error: ${error.message}`);
            await msg.reply('Failed to fetch GIF.');
        }
    }
};
