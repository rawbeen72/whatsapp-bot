// questions.js
const commonQuestions = {
    // Bot Information
    founder: 'Founder of this bot is Manila Aryal.',
    creator: 'This bot was created by Rabin chaulagain.',
    'who made': 'This bot was developed by Rabin chaulagain.',
    'who created': 'This bot was created by Rabin Chaulagain.',    
    // Bot Commands
    'list commands': 'You can see all available commands by typing `!help`.',
    'bot commands': 'Type `!help` to see a list of all available commands.',
    help: 'Type `!help` to see all available commands and their descriptions.',
};

// helper.js
const findBestMatch = (question, questions) => {
    question = question.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const key of Object.keys(questions)) {
        if (question.includes(key.toLowerCase())) {
            const score = key.length;
            if (score > highestScore) {
                highestScore = score;
                bestMatch = key;
            }
        }
    }

    return bestMatch;
};

module.exports = {
    command: '!ask',
    description: 'Get answers for most common questions',
    execute: async (msg, args) => {
        try {
            const question = args.join(' ');
            console.log('Question:', question);

            if (!question) {
                return await msg.reply('Please ask a question!');
            }

            const bestMatch = findBestMatch(question, commonQuestions);
            
            if (bestMatch) {
                return await msg.reply(commonQuestions[bestMatch]);
            } else {
                // If no direct match found, provide a helpful response
                return await msg.reply(
                    'I couldn\'t find a specific answer to your question. '
                    
                );
            }
        } catch (error) {
            console.error('Query command error:', error);
            await msg.reply('Sorry, I encountered an error. Please try again later.');
        }
    }
};