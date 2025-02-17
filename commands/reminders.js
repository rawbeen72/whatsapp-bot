const reminderService = require('../services/reminders');
const chrono = require('chrono-node');

module.exports = [{
    command: '!remind',
    description: 'Set a reminder (e.g., "!remind 1s test" or "!remind in 1 minute test")',
    execute: async (msg, args) => {
        try {
            const text = args.join(' ');
            let parsed = chrono.parse(text);
            let date, message;

            // Improved time parsing
            const timeMatch = text.match(/(?:in\s+)?(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hours?|d|days?)\b/i);
            
            if (timeMatch) {
                const value = parseInt(timeMatch[1]);
                const unit = timeMatch[2].toLowerCase();
                const now = Date.now();
                
                // Calculate time in milliseconds
                const units = {
                    s: 1000,
                    sec: 1000,
                    m: 1000 * 60,
                    min: 1000 * 60,
                    h: 1000 * 60 * 60,
                    d: 1000 * 60 * 60 * 24
                };
                
                date = new Date(now + (value * units[unit[0]]));
                message = text.replace(timeMatch[0], '').trim();
            } 
            else if (parsed.length > 0) {
                date = parsed[0].start.date();
                message = text.replace(parsed[0].text, '').trim();
            } 
            else {
                return msg.reply('Invalid format. Examples:\n!remind 1s test\n!remind 5min coffee break\n!remind in 2 hours meeting');
            }

            const id = reminderService.createReminder(msg.from, date, message);
            await msg.reply(`⏰ Reminder set for ${date.toLocaleTimeString()}`);
        } catch (error) {
            await msg.reply('Error setting reminder: ' + error.message);
        }
    }}, {
    command: '!reminders',
    description: 'List your active reminders',
    execute: async (msg) => {
        try {
            const reminders = reminderService.getUserReminders(msg.from);
            if (reminders.length === 0) {
                return msg.reply('You have no active reminders');
            }
            
            let response = '🔔 *Your Reminders:*\n\n';
            reminders.forEach(reminder => {
                response += `Time: ${reminder.time.toLocaleString()}\nMessage: ${reminder.message}\n\n`;
            });
            
            await msg.reply(response);
        } catch (error) {
            await msg.reply('Failed to fetch reminders');
        }
    }
}];