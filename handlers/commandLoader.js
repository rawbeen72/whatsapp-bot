const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
    load: () => {
        const commands = {};
        const commandDir = path.join(__dirname, '../commands');
        
        fs.readdirSync(commandDir).forEach(file => {
            if (!file.endsWith('.js')) return;
            
            const filePath = path.join(commandDir, file);
            
            try {
                const commandModule = require(filePath);
                
                if (Array.isArray(commandModule)) {
                    commandModule.forEach(cmd => {
                        if (cmd.command && cmd.execute) {
                            logger.success(`Loaded command: ${cmd.command}`);
                            commands[cmd.command] = cmd;
                        }
                    });
                } 
                else if (commandModule.command && commandModule.execute) {
                    logger.success(`Loaded command: ${commandModule.command}`);
                    commands[commandModule.command] = commandModule;
                }
            } catch (error) {
                logger.error(`Error loading ${file}: ${error.message}`);
            }
        });
        
        return commands;
    }
};