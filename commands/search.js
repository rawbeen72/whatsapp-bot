const axios = require('axios');
const async = require('async');
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../config');
const logger = require('../utils/logger');

// Concurrent image downloads limit
const CONCURRENT_DOWNLOADS = 10;
// Concurrent message sends limit
const CONCURRENT_SENDS = 10;

async function searchImages(query) {
    try {
        const response = await axios.get('https://image-search19.p.rapidapi.com/v2/', {
            params: { q: query, hl: 'en' },
            headers: {
                'x-rapidapi-key': config.rapidApiKey,
                'x-rapidapi-host': 'image-search19.p.rapidapi.com'
            }
        });
        return response.data?.response?.images?.slice(0, 5)
            .map(img => img.image?.url)
            .filter(url => url) || [];
    } catch (error) {
        logger.error(`Search Error: ${error.message}`);
        return [];
    }
}

async function processImageUrl(url, msg, sendQueue) {
    try {
        const media = await MessageMedia.fromUrl(url, { unsafeMime: true });
        if (media) {
            // Push to send queue immediately after download
            return await sendQueue.push({ msg, media });
        }
    } catch (error) {
        logger.error(`Process Error for ${url}: ${error.message}`);
    }
    return null;
}

module.exports = {
    command: '!search',
    description: 'Search for images',
    execute: async (msg, args) => {
        if (!args.length) return msg.reply('Please provide a search query');
        
        const query = args.join(' ');
        const loadingMsg = await msg.reply(`🔎 Searching images for "${query}"...`);
        
        try {
            const imageUrls = await searchImages(query);
            console.log("got images of length: ", imageUrls.length);
            if (!imageUrls.length) {
                return msg.reply('No images found 😞');
            }

            // Create send queue first
            const sendQueue = async.queue(async ({ msg, media }) => {
                try {
                    return await msg.reply(media);
                } catch (error) {
                    logger.error(`Send Error: ${error.message}`);
                    return null;
                }
            }, CONCURRENT_SENDS);

            // Create download queue that sends immediately after download
            const downloadQueue = async.queue(async (url) => {
                return await processImageUrl(url, msg, sendQueue);
            }, CONCURRENT_DOWNLOADS);

            // Start processing all URLs
            const processingPromises = imageUrls.map(url => downloadQueue.push(url));

            // Wait for all processing to complete
            const results = await Promise.all(processingPromises);

            // Log statistics
            const successCount = results.filter(r => r !== null).length;
            const failureCount = results.length - successCount;
            
            if (failureCount > 0) {
                logger.error(`Failed to process ${failureCount} out of ${results.length} images`);
            }
            
            if (successCount === 0) {
                await msg.reply('Failed to process images 😞');
            }

        } catch (error) {
            logger.error(`Command Error: ${error.message}`);
            await msg.reply('An error occurred while processing your request 😞');
        } finally {
            if (loadingMsg) {
                try {
                    await loadingMsg.delete(true);
                } catch (deleteError) {
                    logger.error(`Failed to delete loading message: ${deleteError.message}`);
                }
            }
        }
    }
};