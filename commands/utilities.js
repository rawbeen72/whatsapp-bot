module.exports = {
    command: '!help',
    description: 'Show all available commands',
    execute: async (msg) => {
        const helpMessage = `
*🤖 Advanced WhatsApp Bot Help*

*General Commands:*
!help - Show this help message
!ping - Check bot responsiveness
!info - Show bot information

*AI Features:*
!ask [question] - Get AI-powered answers
!genimg [prompt] - Generate AI images

*Utilities:*
!translate [lang] [text] - Translate text
!shorten [url] - Shorten URLs

*News & Information:*
!news [query] - Get latest news articles

*Productivity:*
!remind [time] [message] - Set reminders
!reminders - List active reminders

*Entertainment:*
!joke - Get random joke
!meme - Show random meme
!game - Play mini-games

*Admin Commands:*
!broadcast [message] - Broadcast to all users
!stats - Show bot statistics
`;
        await msg.reply(helpMessage);
    }
};