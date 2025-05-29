const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = {
  command: '!weather',
  description: 'Get weather information for a location',
  execute: async (msg, args) => {
    try {
      if (!args.length) {
        return msg.reply('Please provide a location. Example: !weather London');
      }

      const location = args.join(' ');
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: location,
            appid: config.openWeatherApiKey,
            units: 'metric',
          },
        }
      );

      const weather = response.data;
      const reply =
        `🌤️ *Weather in ${weather.name}*\n\n` +
        `🌡️ Temperature: ${Math.round(weather.main.temp)}°C\n` +
        `💨 Wind: ${weather.wind.speed} m/s\n` +
        `💧 Humidity: ${weather.main.humidity}%\n` +
        `🌅 Description: ${weather.weather[0].description}`;

      await msg.reply(reply);
    } catch (error) {
      logger.error(`Weather Error: ${error.message}`);
      await msg.reply(
        'Could not fetch weather information. Please check the location name.'
      );
    }
  },
};
