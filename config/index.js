require('dotenv').config();

module.exports = {
  sessionName: process.env.WHATSAPP_SESSION_NAME || 'default',
  openWeatherKey: process.env.OPENWEATHER_API_KEY,
  khaltiApiBase: process.env.KHALTI_API_BASE || 'https://khalti.com/api/v2',
  khaltiDeviceId:
    process.env.KHALTI_DEVICE_ID || 'kwa-d3d9b347-715e-45cf-bbbd-e608d08ff2ba',
  rapidApiKey: process.env.RAPIDAPI_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
  newsApiKey: process.env.NEWSAPI_KEY,
  adminNumbers: process.env.ADMIN_NUMBERS?.split(',') || [],
  translateKey: process.env.TRANSLATE_API_KEY,
  bitlyKey: process.env.BITLY_KEY,
  khaltiToken: process.env.KHALTI_TOKEN, // Ensure this is KHALTI_API_TOKEN in .env for consistency
  citizenAccountId: process.env.CITIZEN_ACCOUNT_ID,
  citienCode: process.env.CITIZEN_BANK_CODE, // Renamed for clarity
  prabhuAccountId: process.env.PRABHU_ACCOUNT_ID,
  prabhuCode: process.env.PRABHU_BANK_CODE, // Renamed for clarity
  giphyAPIKey: process.env.GIPHY_API_KEY,
};
