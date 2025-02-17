const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

// ----- QuickChart Helpers -----
function getChartUrl(config) {
    const encodedConfig = encodeURIComponent(JSON.stringify(config));
    // Adjust width/height to your preference
    return `https://quickchart.io/chart?c=${encodedConfig}&width=500&height=300`;
}

async function downloadChartImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
}

// ----- PDF Helpers -----
// This helper function adds a new page for each chart to avoid overlapping.
function addChartOnNewPage(doc, chartBuffer, title) {
    doc.addPage();
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .text(title, { align: 'center' })
       .moveDown(0.5);

    doc.image(chartBuffer, {
        fit: [500, 300],
        align: 'center'
    })
    .moveDown(1);
}

module.exports = {
    command: '!chat-report',
    description: 'Generate a comprehensive chat analytics report for the full chat history as PDF',
    execute: async (msg, args) => {
        try {
            const client = require('../index').client;
            const chat = await client.getChatById(msg.from);
            logger.info(`Started generating report for chat: ${chat.name}`);
            
            // Initial progress message
            await msg.reply('📊 Generating chat report for the full chat history...');
            
            // ----- FETCH FULL CHAT HISTORY -----
            logger.info('Fetching full chat history...');
            let allMessages = [];
            
            // Fetch initial batch (limit: 100)
            let lastBatch = await chat.fetchMessages({ limit: 100 });
            allMessages.push(...lastBatch);
            logger.info(`Fetched initial batch: ${lastBatch.length} messages. Total so far: ${allMessages.length}`);
            
            // Pagination variables
            let iteration = 0;
            const maxIterations = 10000; // safeguard
            let previousOldestTimestamp = null;
            
            // Keep fetching older messages in 100-message batches
            while (iteration < maxIterations) {
                if (!lastBatch.length) break;
                const oldestMessage = lastBatch[lastBatch.length - 1];
                
                // If the oldest timestamp hasn't changed, break out
                if (previousOldestTimestamp !== null && oldestMessage.timestamp === previousOldestTimestamp) {
                    logger.info("Oldest message timestamp unchanged; ending pagination.");
                    break;
                }
                previousOldestTimestamp = oldestMessage.timestamp;
                
                // Fetch next batch
                const nextBatch = await chat.fetchMessages({ limit: 100, before: oldestMessage.id });
                if (!nextBatch.length) {
                    logger.info("Next batch returned 0 messages; ending pagination.");
                    break;
                }
                
                allMessages.push(...nextBatch);
                logger.info(`Fetched additional batch: ${nextBatch.length} messages. Total so far: ${allMessages.length}`);
                
                // If we got fewer than 100 messages, assume no more remain
                if (nextBatch.length < 100) {
                    logger.info("Received a batch smaller than requested limit; ending pagination.");
                    break;
                }
                
                lastBatch = nextBatch;
                iteration++;
            }
            
            logger.info(`Completed fetching chat history. Total messages: ${allMessages.length}`);
            await msg.reply(`Fetched full chat history with ${allMessages.length} messages. Analyzing chat data...`);
            
            // ----- ANALYTICS -----
            let totalMessages = allMessages.length;
            let messagesPerSender = {};
            let messagesOverTime = {}; // grouped by date (YYYY-MM-DD)
            let mediaCount = 0, textCount = 0;
            
            // Additional analytics: day-of-week, hour-of-day, top words
            let dayOfWeekStats = [0, 0, 0, 0, 0, 0, 0]; // Sunday -> Saturday
            let hourOfDayStats = new Array(24).fill(0); // 0 -> 23
            let wordFrequency = {}; // for top-words analysis

            // A very basic stopword list for demonstration:
            const stopwords = new Set([
                'the', 'and', 'you', 'are', 'for', 'this', 'that', 'with', 'have',
                'just', 'what', 'your', 'from', 'there', 'they', 'about', 'like',
                'will', 'could', 'would', 'should', 'how', 'where', 'when', 'which',
                'whats', 'cant', 'dont', 'didnt', 'hasnt', 'wont', 'ive', 'why', 
                'had', 'was', 'were', 'who', 'them', 'too', 'got', 'her', 'his',
                'been', 'once', 'only', 'then'
            ]);

            for (const message of allMessages) {
                // Determine sender name
                const sender = message.fromMe ? 'You' : (message._data.notifyName || 'Unknown');
                messagesPerSender[sender] = (messagesPerSender[sender] || 0) + 1;
                
                // Group messages by date
                const dateObj = new Date(message.timestamp * 1000);
                const dateStr = dateObj.toISOString().slice(0, 10);
                messagesOverTime[dateStr] = (messagesOverTime[dateStr] || 0) + 1;
                
                // Day-of-week stats
                const dayIndex = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
                dayOfWeekStats[dayIndex]++;
                
                // Hour-of-day stats
                const hour = dateObj.getHours(); // 0..23
                hourOfDayStats[hour]++;
                
                // Count message type
                if (message.hasMedia) {
                    mediaCount++;
                } else {
                    textCount++;
                    
                    // Very basic word-frequency analysis
                    // 1) Lowercase
                    // 2) Remove punctuation
                    // 3) Split on whitespace
                    // 4) Filter out stopwords & short words
                    const cleaned = message.body
                        .toLowerCase()
                        .replace(/[^\p{L}\p{N}\s]/gu, ' '); // remove punctuation
                    const words = cleaned.split(/\s+/g).filter(w => w.length > 2 && !stopwords.has(w));
                    
                    for (const w of words) {
                        wordFrequency[w] = (wordFrequency[w] || 0) + 1;
                    }
                }
            }

            logger.info('Chat analytics computed.');
            await msg.reply('Chat data analysis complete. Generating charts...');

            // Convert dayOfWeekStats -> { Sunday: X, Monday: Y, ... } for clarity
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            // Convert hourOfDayStats -> [0..23]
            
            // Build a top-words array sorted by frequency
            const sortedWords = Object.keys(wordFrequency).sort((a, b) => wordFrequency[b] - wordFrequency[a]);
            const topWords = sortedWords.slice(0, 10); // top 10 words
            const topWordCounts = topWords.map(w => wordFrequency[w]);

            // ----- CHART GENERATION USING QuickChart.io -----
            // Original 3 charts: per Sender, Over Time, Type Distribution

            // 1) Chart: Messages per Sender (Bar)
            const senderChartConfig = {
                type: 'bar',
                data: {
                    labels: Object.keys(messagesPerSender),
                    datasets: [{
                        label: 'Messages per Sender',
                        data: Object.values(messagesPerSender),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: { display: true, text: 'Messages per Sender' }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            };
            const senderChartUrl = getChartUrl(senderChartConfig);
            const senderChartBuffer = await downloadChartImage(senderChartUrl);
            logger.info('Sender chart generated.');
            
            // 2) Chart: Messages Over Time (Line)
            const sortedDates = Object.keys(messagesOverTime).sort();
            const timeChartConfig = {
                type: 'line',
                data: {
                    labels: sortedDates,
                    datasets: [{
                        label: 'Messages Over Time',
                        data: sortedDates.map(date => messagesOverTime[date]),
                        fill: false,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        tension: 0.1
                    }]
                },
                options: {
                    plugins: {
                        title: { display: true, text: 'Messages Over Time' }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            };
            const timeChartUrl = getChartUrl(timeChartConfig);
            const timeChartBuffer = await downloadChartImage(timeChartUrl);
            logger.info('Time chart generated.');
            
            // 3) Chart: Message Type Distribution (Pie)
            const mediaChartConfig = {
                type: 'pie',
                data: {
                    labels: ['Text', 'Media'],
                    datasets: [{
                        data: [textCount, mediaCount],
                        backgroundColor: [
                            'rgba(255, 159, 64, 0.6)',
                            'rgba(54, 162, 235, 0.6)'
                        ]
                    }]
                },
                options: {
                    plugins: {
                        title: { display: true, text: 'Message Type Distribution' }
                    }
                }
            };
            const mediaChartUrl = getChartUrl(mediaChartConfig);
            const mediaChartBuffer = await downloadChartImage(mediaChartUrl);
            logger.info('Media chart generated.');

            // ----- NEW CHARTS -----
            // 4) Day-of-Week Distribution (Bar)
            const dayOfWeekChartConfig = {
                type: 'bar',
                data: {
                    labels: dayNames,
                    datasets: [{
                        label: 'Messages by Day of Week',
                        data: dayOfWeekStats,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: { display: true, text: 'Messages by Day of Week' }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            };
            const dayOfWeekChartUrl = getChartUrl(dayOfWeekChartConfig);
            const dayOfWeekChartBuffer = await downloadChartImage(dayOfWeekChartUrl);
            logger.info('Day-of-week chart generated.');

            // 5) Hour-of-Day Distribution (Bar)
            const hourLabels = Array.from({ length: 24 }, (_, i) => i.toString());
            const hourOfDayChartConfig = {
                type: 'bar',
                data: {
                    labels: hourLabels,
                    datasets: [{
                        label: 'Messages by Hour (0-23)',
                        data: hourOfDayStats,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: { display: true, text: 'Messages by Hour of Day' }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            };
            const hourOfDayChartUrl = getChartUrl(hourOfDayChartConfig);
            const hourOfDayChartBuffer = await downloadChartImage(hourOfDayChartUrl);
            logger.info('Hour-of-day chart generated.');

            // 6) Top Words (Bar)
            const topWordsChartConfig = {
                type: 'bar',
                data: {
                    labels: topWords,
                    datasets: [{
                        label: 'Top Words',
                        data: topWordCounts,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: { display: true, text: 'Top 10 Words' }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            };
            const topWordsChartUrl = getChartUrl(topWordsChartConfig);
            const topWordsChartBuffer = await downloadChartImage(topWordsChartUrl);
            logger.info('Top-words chart generated.');

            await msg.reply('All charts generated. Creating PDF report...');
            
            // ----- CREATE PDF REPORT -----
            const exportsDir = path.join(__dirname, '../../exports');
            if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
            }
            const filename = `chat_report_${Date.now()}.pdf`;
            const filePath = path.join(exportsDir, filename);
            const doc = new PDFDocument({
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            
            // --- Page 1: Title and summary ---
            doc.font('Helvetica-Bold')
               .fontSize(20)
               .text(`Chat Report for ${chat.name}`, { align: 'center', underline: true })
               .moveDown(0.5)
               .font('Helvetica')
               .fontSize(12)
               .text(`Report generated on ${new Date().toLocaleString()}`, { align: 'center' })
               .moveDown(2);

            doc.font('Helvetica-Bold')
               .fontSize(16)
               .text('Overall Chat Analytics', { underline: true })
               .moveDown(1);
            doc.font('Helvetica')
               .fontSize(12)
               .list([
                   `Total Messages: ${totalMessages}`,
                   `Total Text Messages: ${textCount}`,
                   `Total Media Messages: ${mediaCount}`
               ])
               .moveDown(1);

            // --- Existing charts each on a new page ---
            addChartOnNewPage(doc, senderChartBuffer, 'Messages per Sender');
            addChartOnNewPage(doc, timeChartBuffer, 'Messages Over Time');
            addChartOnNewPage(doc, mediaChartBuffer, 'Message Type Distribution');

            // --- New charts on separate pages ---
            addChartOnNewPage(doc, dayOfWeekChartBuffer, 'Messages by Day of Week');
            addChartOnNewPage(doc, hourOfDayChartBuffer, 'Messages by Hour of Day');
            addChartOnNewPage(doc, topWordsChartBuffer, 'Top 10 Words');

            // --- Final textual analysis ---
            doc.addPage()
               .font('Helvetica-Bold')
               .fontSize(16)
               .text('Detailed Analysis', { underline: true })
               .moveDown(1);

            // Most active day
            const mostActiveDay = Object.keys(messagesOverTime).reduce((a, b) =>
                messagesOverTime[a] > messagesOverTime[b] ? a : b, null);
            doc.font('Helvetica')
               .fontSize(12)
               .text(`• The most active day was ${mostActiveDay} with ${messagesOverTime[mostActiveDay]} messages.`)
               .moveDown(0.5);

            // Top sender
            const topSender = Object.keys(messagesPerSender).reduce((a, b) =>
                messagesPerSender[a] > messagesPerSender[b] ? a : b, null);
            doc.text(`• The top sender is ${topSender} with ${messagesPerSender[topSender]} messages.`)
               .moveDown(0.5);

            // Busiest day of week
            const maxDayCount = Math.max(...dayOfWeekStats);
            const busiestDayIndex = dayOfWeekStats.indexOf(maxDayCount);
            doc.text(`• The busiest day of the week is ${dayNames[busiestDayIndex]} with ${maxDayCount} messages.`)
               .moveDown(0.5);

            // Busiest hour
            const maxHourCount = Math.max(...hourOfDayStats);
            const busiestHourIndex = hourOfDayStats.indexOf(maxHourCount);
            doc.text(`• The busiest hour of the day is ${busiestHourIndex}:00 with ${maxHourCount} messages.`)
               .moveDown(0.5);

            // Top word
            if (topWords.length > 0) {
                doc.text(`• The top word is "${topWords[0]}" used ${wordFrequency[topWords[0]]} times.`)
                   .moveDown(1);
            } else {
                doc.text('• No significant words found.')
                   .moveDown(1);
            }

            // Add page numbers
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8)
                   .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, { align: 'center' });
            }
            
            // Finalize the PDF and wait for the stream to finish
            doc.end();
            await new Promise(resolve => stream.on('finish', resolve));
            logger.info('PDF report created.');
            
            // Inform user and send the PDF file
            await msg.reply('✅ PDF report created. Sending now...');
            const media = MessageMedia.fromFilePath(filePath);
            await msg.reply(media, null, { sendMediaAsDocument: true });
            logger.info('Report sent successfully.');
            
            // Cleanup
            fs.unlinkSync(filePath);
            logger.info('Temporary file cleaned up.');
            
        } catch (error) {
            console.error(error);
            logger.error(`Chat Report Error: ${error.message}`);
            msg.reply('Failed to generate chat report. Please try again later.');
        }
    }
};
