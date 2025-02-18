const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const logger = require('../utils/logger');
const config = require('../config');

const API_CONFIG = {
  baseURL: 'https://youtube-mp36.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': config.rapidApiKey,
    'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
  }
};

// Enhanced URL parsing function to handle multiple YouTube URL formats
const extractVideoID = (url) => {
  try {
    // Handle both URL and URI encoded URLs
    const decodedUrl = decodeURIComponent(url);
    
    // Array of regex patterns for different YouTube URL formats
    const patterns = [
      // Standard format: https://www.youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\?\/\s]{11})/,
      // Short format: https://youtu.be/VIDEO_ID
      /(?:youtu\.be\/)([^&\?\/\s]{11})/,
      // Mobile format: https://m.youtube.com/watch?v=VIDEO_ID
      /(?:m\.youtube\.com\/watch\?v=)([^&\?\/\s]{11})/,
      // Short mobile format with parameters
      /(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:\?|&|$)/
    ];

    // Try each pattern until we find a match
    for (const pattern of patterns) {
      const match = decodedUrl.match(pattern);
      if (match && match[1]) {
        // Validate the video ID format
        if (/^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
          return match[1];
        }
      }
    }

    // If no pattern matches, try to extract directly from the path
    const urlObj = new URL(decodedUrl);
    const pathSegments = urlObj.pathname.split('/');
    const potentialId = pathSegments[pathSegments.length - 1];
    
    if (potentialId && /^[a-zA-Z0-9_-]{11}$/.test(potentialId)) {
      return potentialId;
    }

    return null;
  } catch (error) {
    logger.error(`Error parsing YouTube URL: ${error.message}`);
    return null;
  }
};

const checkConversionStatus = async (videoId) => {
  try {
    const response = await axios.get('/dl', {
      ...API_CONFIG,
      params: { id: videoId }
    });
    return response.data;
  } catch (error) {
    logger.error(`Conversion status check failed: ${error.message}`);
    throw new Error('Failed to check conversion status');
  }
};

const pollForMP3 = async (videoId, attempt = 1) => {
  const maxAttempts = 5;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    const result = await checkConversionStatus(videoId);
    
    if (result.status === 'processing' && attempt <= maxAttempts) {
      await delay(3000);
      return pollForMP3(videoId, attempt + 1);
    }
    
    return result;
  } catch (error) {
    logger.error(`Polling failed on attempt ${attempt}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  command: '!yt_mp3',
  description: 'Convert YouTube video to MP3',
  execute: async (msg, args) => {
    try {
      const client = require('../index').client;
      // Validate input
      if (!args.length) {
        await msg.reply('Please provide a YouTube URL');
        return;
      }

      const videoUrl = args[0];
      const videoId = extractVideoID(videoUrl);
      
      if (!videoId) {
        await msg.reply('❌ Invalid YouTube URL. Please make sure you\'re using a valid YouTube video link.');
        return;
      }

      // Send initial status message with video ID for verification
      await msg.reply(`⏳ Starting conversion for video ID: ${videoId}...`);
      
      // Poll for conversion status
      const conversion = await pollForMP3(videoId);
      
      if (conversion.status !== 'ok') {
        await statusMsg.reply(`❌ Conversion failed: ${conversion.msg}`);
        return;
      }

      try {
        // Download and prepare media
        const media = await MessageMedia.fromUrl(conversion.link, {
          unsafeMime: true,
          filename: `youtube_${videoId}.mp3`
        });

        // Try to send as regular media first
        try {
          await client.sendMessage(msg.from, media);
        } catch (sendError) {
          console.error(sendError);
          logger.warn(`Failed to send as regular media, attempting as document: ${sendError.message}`);
          await client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
        }

        // Clean up status message
        await msg.reply('✅ Conversion completed successfully!');

      } catch (mediaError) {
        console.error(mediaError);
        logger.error(`Media preparation failed: ${mediaError.message}`);
        await msg.reply('❌ Failed to prepare media. The file might be too large or unavailable.');
      }
      
    } catch (error) {
      console.error(error);
      logger.error(`YT MP3 Error: ${error.stack}`);
      await msg.reply('❌ Conversion failed. Please try again later.');
    }
  }
};