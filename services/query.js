const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class QueryChatbotService {
    async getAnswer(query) {
        try {
            const response = await axios.post('https://open-ai21.p.rapidapi.com/conversationllama', 
                {
                    messages: [{
                        role: 'user',
                        content: query
                    }],
                    web_access: false
                },
                {
                    headers: {
                        'x-rapidapi-key': config.rapidApiKey,
                        'x-rapidapi-host': 'open-ai21.p.rapidapi.com',
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(response)
            return {
                result: response.data?.result || 'No response received from chatbot',
                status: true
            };
            
        } catch (error) {
            logger.error(`API Error: ${error.message}`);
            
            // If it's an API error with a response, log additional details
            if (error.response) {
                logger.error(`Status: ${error.response.status}`);
                logger.error(`Data: ${JSON.stringify(error.response.data)}`);
            }
            
            throw new Error('Failed to fetch response');
        }
    }
}

module.exports = new QueryChatbotService();