const { scheduleJob } = require('node-schedule');
const logger = require('../utils/logger');
const client = require('../index');

class ReminderService {
    constructor() {
        this.reminders = new Map();
        this.nextId = 1;
    }

    createReminder(user, time, message) {
        try {
            const now = Date.now();
            const timeDiff = time.getTime() - now;
            
            // Use setTimeout for reminders < 2 minutes for better accuracy
            if (timeDiff < 120000) {
                const timeoutId = setTimeout(async () => {
                    await this.sendReminder(user, message);
                    this.reminders.delete(id);
                }, timeDiff);
                
                const id = this.nextId++;
                this.reminders.set(id, {
                    id,
                    type: 'timeout',
                    timeoutId,
                    time,
                    message,
                    user
                });
                return id;
            }
            
            // Use node-schedule for longer durations
            const job = scheduleJob(time, async () => {
                await this.sendReminder(user, message);
                this.reminders.delete(id);
            });
            
            const id = this.nextId++;
            this.reminders.set(id, {
                id,
                type: 'schedule',
                job,
                time,
                message,
                user
            });
            return id;
        } catch (error) {
            logger.error(`Reminder Creation Error: ${error.message}`);
            throw new Error('Failed to create reminder');
        }
    }

    cancelReminder(reminderId) {
        const reminder = this.reminders.get(reminderId);
        if (reminder) {
            if (reminder.type === 'timeout') {
                clearTimeout(reminder.timeoutId);
            } else {
                reminder.job.cancel();
            }
            this.reminders.delete(reminderId);
            return true;
        }
        return false;
    }

    async sendReminder(user, message) {
        try {
            const { client } = require('../index');
            await client.sendMessage(user, `⏰ REMINDER: ${message}`);
        } catch (error) {
            logger.error(`Reminder Delivery Error: ${error.message}`);
        }
    }

    getUserReminders(user) {
        return Array.from(this.reminders.values())
            .filter(r => r.user === user);
    }
}

module.exports = new ReminderService();