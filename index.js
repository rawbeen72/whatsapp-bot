const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const logger = require('./utils/logger');
const commandLoader = require('./handlers/commandLoader');
const auth = require('./utils/auth');
const http = require('http');

const readline = require('readline');

// Initialize client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Load commands
const commands = commandLoader.load();

// Client events
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('QR String:', qr);  // Add this line to print the QR string
    logger.info('QR code generated');
});


async function getNumber() {
    const info = client.info;
    return info.wid._serialized;
}



client.on('ready', () => {
    logger.success('Client is ready!');
    
    // Initialize test mode with proper input handling
    console.log('\n=== WHATSAPP BOT ===');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\nPress "T" + Enter to enter test mode');
    
    rl.on('line', (input) => {
        if (input.trim().toLowerCase() === 't') {
            rl.close();
            require('./utils/testMode')(client);
        }
    });
});
client.on('message', async msg => {
    try {
        // Basic security checks
        if (!auth.checkRateLimit(msg.from)) {
            return msg.reply('⚠️ Too many requests! Please wait...');
        }
        
        const [command, ...args] = msg.body.split(' ');
        const handler = commands[command.toLowerCase()];
        
        if (handler) {
            if (handler.adminOnly && !auth.isAdmin(msg.from)) {
                return msg.reply('🔒 This command is for admins only');
            }
            await handler.execute(msg, args);
        }
    } catch (error) {
        logger.error(`Message Handling Error: ${error.message}`);
        msg.reply('⚠️ An error occurred while processing your request');
    }
});
// inject getNumber function into client
client.getNumber = getNumber;

module.exports.client = client;

client.initialize();
http.createServer((req, res) => {
    return res.end('Bot is running');
}
).listen(process.env.PORT || 5000);

// Keep alive mechanism
setInterval(() => {
    http.get(`http://localhost:${process.env.PORT || 5000}`, (resp) => {
        logger.info('Keep-alive request sent');
    }).on('error', (err) => {
        logger.error('Keep-alive request failed:', err.message);
    });
}, 5 * 60 * 1000); // 5 minutes in milliseconds




process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    // process.exit(1);
});