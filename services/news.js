const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class NewsService {
    async getLatestNews(query = 'technology') {
        try {
            const response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: query,
                    apiKey: config.newsApiKey,
                    pageSize: 5,
                    sortBy: 'publishedAt'
                }
            });
            
            return response.data.articles.map(article => ({
                title: article.title,
                url: article.url,
                source: article.source.name
            }));
        } catch (error) {
            console.error(error);
            logger.error(`News API Error: ${error.message}`);
            throw new Error('Failed to fetch news');
        }
    }
}

module.exports = new NewsService();