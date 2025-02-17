const newsService = require('../services/news');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    command: '!news',
    description: 'Get latest news articles',
    execute: async (msg, args) => {
        try {
            const query = args.join(' ') || 'technology';
            const articles = await newsService.getLatestNews(query);
            
            if (articles.length === 0) {
                return msg.reply('No articles found for your search');
            }

            let response = query ? `📰 *Latest News for ${query}:*\n\n` :  `📰 *Latest News:*\n\n`
            articles.forEach((article, index) => {
                response += `${index + 1}. [${article.title}](${article.url}) - ${article.source}\n`;
            });

            await msg.reply(response);
        } catch (error) {
            await msg.reply('Failed to fetch news. Please try again later.');
        }
    }
};