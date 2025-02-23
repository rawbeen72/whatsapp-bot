require('dotenv').config();

module.exports = {
    sessionName: process.env.WHATSAPP_SESSION_NAME || 'default',
    openWeatherKey: process.env.OPENWEATHER_API_KEY,
    rapidApiKey: process.env.RAPIDAPI_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    newsApiKey: process.env.NEWSAPI_KEY,
    adminNumbers: process.env.ADMIN_NUMBERS?.split(',') || [],
    translateKey: process.env.TRANSLATE_API_KEY,
    bitlyKey: process.env.BITLY_KEY,
    khaltiToken: process.env.KHALTI_TOKEN,
    citizenAccountId: process.env.CITIZEN_ACCOUNT_ID,
    citienCode: process.env.CITIZEN_CODE,
    prabhuAccountId: process.env.PRABHU_ACCOUNT_ID,
    prabhuCode: process.env.PRABHU_CODE,
    giphyAPIKey: process.env.GIPHY_API_KEY,
};