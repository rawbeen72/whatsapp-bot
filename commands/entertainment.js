const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const logger = require('../utils/logger');

module.exports = [{
    command: '!joke',
    description: 'Get a random joke',
    execute: async (msg) => {
        try {
            const response = await axios.get('https://v2.jokeapi.dev/joke/Any');
            const joke = response.data.setup ? 
                `${response.data.setup}\n...\n${response.data.delivery}` : 
                response.data.joke;
            msg.reply(joke);
        } catch (error) {
            logger.error(`Joke Error: ${error.message}`);
            msg.reply("Why did the chicken cross the road? To get to the broken API!");
        }
    }
}, {
    command: '!meme',
    description: 'Get a random meme',
    execute: async (msg) => {
        try {
            const response = await axios.get('https://meme-api.com/gimme');
            const media = await MessageMedia.fromUrl(response.data.url, {unsafeMime:true});
            msg.reply(media, { caption: response?.data?.title, sendMediaAsDocument: true  });
        } catch (error) {
            logger.error(`Meme Error: ${error?.message}`);
            msg.reply("Couldn't fetch meme 😞");
        }
    }
}];