const readline = require('readline');
const logger = require('./logger');

module.exports = (client) => {
    logger.info('\n=== TEST MODE ACTIVATED ===');
    logger.info('Type commands directly (e.g., !search cats)');
    logger.info('Type "exit" to quit test mode\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'TEST INPUT> '
    });

    // Get bot's number for media forwarding
    let botNumber = '';
    client.getNumber().then(number => botNumber = number);

    rl.prompt();

    rl.on('line', async (input) => {
        if (input.toLowerCase().trim() === 'exit') {
            rl.close();
            process.exit(0);
        }

        // Simulate message event with media handling
        client.emit('message', {
            from: botNumber,
            body: input,
            reply: async (content, options) => {
                    console.log("sending message to your number...");
                    client.sendMessage(botNumber, content);
            }
        });

        rl.prompt();
    });
};