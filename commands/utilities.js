// Array of command objects for multiple commands
module.exports = [{
    command: '!help',
    description: 'Show all available commands',
    execute: async (msg) => {
        const helpMessage = `
*🤖 WhatsApp Bot Command Center*

*General Commands:*
!help - Show this help message
!ping - Check bot responsiveness
!info - Show bot information

*Weather & Information:*
!weather [location] - Get current weather for a location
!news [query] - Get latest news articles (defaults to technology)
!define [word] - Look up word definitions

*Utilities:*
!calc [expression] - Calculate math expressions
!poll "question" "option1" "option2" - Create interactive polls
!translate [lang] [text] - Translate text to different languages
!search [query] - Search the web for information

*Finance & Transactions:*
!fund-transfer - Transfer funds between accounts
!load-fund - Load funds to your account
!load-otp - Verify OTP for transactions
!topup - Top up mobile credit

*AI & Assistance:*
!ask [question] - Get answers to common questions

*Productivity:*
!remind [time] [message] - Set reminders (e.g., "!remind 5min coffee break")
!reminders - List all your active reminders

*Media & Entertainment:*
!joke - Get a random joke
!meme - Show a random meme
!gif [query] - Search for GIFs
!yt-mp3 [URL] - Convert YouTube videos to MP3

*Chat Tools:*
!chat-report - Generate chat analytics report
!chat-export - Export chat history

`;
        await msg.reply(helpMessage);
    }
}, {
    command: '!ping',
    description: 'Check bot responsiveness',
    execute: async (msg) => {
        // Record start time
        const startTime = Date.now();
                
        // Calculate response time
        const responseTime = Date.now() - startTime;
        
        // Update with response time
        await msg.reply(`🏓 Pong! Response time: ${responseTime}ms`);
    }
}, {
    command: '!info',
    description: 'Show bot information',
    execute: async (msg) => {
        // Import package.json for version info
        const packageInfo = require('../package.json');
        const os = require('os');
        
        // Calculate uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        // Get system info
        const memoryUsage = process.memoryUsage();
        const freeMemory = os.freemem() / 1024 / 1024;
        const totalMemory = os.totalmem() / 1024 / 1024;
        
        // Build info message
        const infoMessage = `
*🤖 WhatsApp Bot Information*

*Version:* ${packageInfo.version}
*Uptime:* ${uptimeString}
*Node.js:* ${process.version}
*Memory Usage:* ${Math.round(memoryUsage.rss / 1024 / 1024)} MB
*System Memory:* ${Math.round(freeMemory)} MB free of ${Math.round(totalMemory)} MB

*Created by:* Rabin Chaulagain

Type *!help* to see available commands.
        `;
        
        await msg.reply(infoMessage);
    }
}];