const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');


function detectNumber(mobile) {
    const prefix = mobile.slice(0, 3);
    if (['984', '986', '974', '976'].includes(prefix)) {
        return "ntc"
    } else if (['980', '981', '982', '970'].includes(prefix)) {
        return "ncell"
    } else if (prefix === '985') {
        return "nt-postpaid"
    }
    return -1;
}

// API Configuration
const API_BASE = 'https://khalti.com/api/v2/service/use';
const API_TOKEN = config.khaltiToken;
const DEVICE_ID = 'kwa-d3d9b347-715e-45cf-bbbd-e608d08ff2ba';

async function sendTopup(mobile, amount) {
    try {
        const payload = {
            number: mobile.toString(),
            amount: amount.toString()
        };

        // Create axios instance with persistent settings
        const instance = axios.create({
            withCredentials: true,
            headers: {
                'Authorization': `Token ${API_TOKEN}`,
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.8',
                'Content-Type': 'application/json',
                'DeviceId': DEVICE_ID,
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Sec-GPC': '1',
                'Referer': 'https://web.khalti.com/',
                'Origin': 'https://web.khalti.com',
                'sec-ch-ua': '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Linux"',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            }
        });

        // Initialize session by visiting the main page first
        await instance.get('https://web.khalti.com/');

        // Make the topup request
        const TOPUP_URL = `${API_BASE}/${detectNumber(mobile)}/`;
        const response = await instance.post(TOPUP_URL, payload);
        return response.data;

    } catch (error) {
        const errorData = error.response?.data;
        logger.error(`Topup failed: ${JSON.stringify(errorData)}`);
        
        // Enhanced error handling
        if (errorData?.error_key === 'insufficient_balance') {
            throw new Error('Insufficient balance in wallet');
        } else if (error.response?.status === 403) {
            throw new Error('Authentication failed.');
        } else if (error.response?.status === 429) {
            throw new Error('Too many requests. Please try again later');
        }
        
        throw new Error(errorData?.detail || 'Failed to process topup request');
    }
}

module.exports = {
    command: '!topup',
    description: 'Topup mobile balance (usage: !topup [number] [amount])',
    execute: async (msg, args) => {
        try {
            const adminNumbers = config.adminNumbers;
            const extractedAdminNumbers = adminNumbers.map(number => number.slice(0, 13));
            const senderNumber = msg.from.split('@')[0].slice(3);
            if (!extractedAdminNumbers.includes(senderNumber)) {
                return msg.reply('🔒 This command is for admins only');
            }
            // Validate arguments
            if (args.length < 2) {
                return msg.reply('Invalid format. Usage: !topup [number] [amount]\nExample: !topup 9864461540 10');
            }

            const [mobile, amount] = args;
            
            // Enhanced mobile validation
            if (!/^[9][0-9]{9}$/.test(mobile)) {
                return msg.reply('Please enter a valid 10-digit mobile number starting with 9');
            }

            const numAmount = parseInt(amount);
            if (isNaN(numAmount) || numAmount < 10 || numAmount > 500) {
                return msg.reply('Please enter a valid amount between 10 and 500 NPR');
            }

            // Send processing message
            await msg.reply(`🔄 Processing ${numAmount} NPR topup to ${mobile}...`);

            await sendTopup(mobile, numAmount);
            
            let response = `✅ *Topup Successful*\n`;
            response += `📱 Number: ${mobile}\n`;
            response += `💰 Amount: ${numAmount} NPR\n`;
            
            await msg.reply(response);

        } catch (error) {
            const errorMsg = `❌ ${error.message}`;
            await msg.reply(errorMsg);
            logger.error(`Topup Error: ${error.message}`);
        }
    }
};