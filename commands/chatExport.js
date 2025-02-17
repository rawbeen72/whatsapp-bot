const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');
const PDFDocument = require('pdfkit');
const sizeOf = require('image-size');
const logger = require('../utils/logger');

module.exports = {
    command: '!chat-export',
    description: 'Export chat history as PDF (usage: !chat-export [number of messages])',
    execute: async (msg, args) => {
        console.log(msg)
        try {
            const client = require('../index').client;
            const chat = await client.getChatById(msg.from);
            const limit = args[0] ? parseInt(args[0]) : 100000;
            
            if (isNaN(limit) || limit < 1 || limit > 100000) {
                return msg.reply('Please specify a number between 1-100000');
            }

            await msg.reply(`📤 Exporting chat messages to PDF...`);

            // Create exports directory if it doesn't exist
            const exportsDir = path.join(__dirname, '../../exports');
            if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
            }

            // Initialize PDF document
            const filename = `chat_export_${Date.now()}.pdf`;
            const filePath = path.join(exportsDir, filename);
            const doc = new PDFDocument({
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                },
                size: 'A4',
                bufferPages: true // Enable page buffering for footer
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Add header
            doc.font('Helvetica-Bold')
               .fontSize(18)
               .text(`Chat History with ${chat.name}`, {
                   align: 'center',
                   underline: true
               })
               .moveDown(0.5)
               .fontSize(12)
               .text(`Exported on ${new Date().toLocaleString()}`, {
                   align: 'center'
               })
               .moveDown(2);

            // Fetch messages
            const messages = await chat.fetchMessages({ limit });
            
            // Calculate available page height
            const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
            
            // Process messages in chronological order
            for (const message of messages.reverse()) {
                const date = new Date(message.timestamp * 1000).toLocaleString();
                const sender = message.fromMe ? 'You' : (message._data.notifyName || 'Unknown');
                
                // Check if we need a new page for header
                if (doc.y > pageHeight - 100) {
                    doc.addPage();
                }

                // Message header
                doc.font('Helvetica-Bold')
                   .fontSize(10)
                   .text(`${date} - ${sender}:`)
                   .moveDown(0.2);

                // Handle media messages
                if (message.hasMedia) {
                    try {
                        const media = await message.downloadMedia();
                        if (media && media.mimetype.startsWith('image/')) {
                            // If space is low, add a new page before inserting the image
                            if (doc.y > pageHeight - 300) {
                                doc.addPage();
                            }

                            const imgBuffer = Buffer.from(media.data, 'base64');
                            
                            // Define maximum dimensions
                            const maxWidth = 300;
                            const maxHeight = 200;
                            
                            // Calculate scaled dimensions using image-size
                            const dimensions = sizeOf(imgBuffer);
                            const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height);
                            const drawnWidth = dimensions.width * scale;
                            const drawnHeight = dimensions.height * scale;
                            
                            // Capture current y position and insert image centered
                            const currentY = doc.y;
                            doc.image(imgBuffer, {
                                fit: [maxWidth, maxHeight],
                                align: 'center'
                            });
                            
                            // Manually update y to account for image height plus some margin
                            doc.y = currentY + drawnHeight + 10;
                        }
                    } catch (error) {
                        logger.error(`Failed to process media: ${error.message}`);
                        doc.font('Helvetica-Oblique')
                           .fontSize(9)
                           .text('[Media content unavailable]')
                           .moveDown(0.5);
                    }
                }

                // Message content
                if (message.body) {
                    // If space is low, add a new page for text
                    if (doc.y > pageHeight - 100) {
                        doc.addPage();
                    }

                    doc.font('Helvetica')
                       .fontSize(10)
                       .text(message.body, {
                           width: 445,
                           align: 'left',
                           lineGap: 2
                       });
                }

                doc.moveDown(1);
                
                // Add separator line
                doc.moveTo(50, doc.y)
                   .lineTo(545, doc.y)
                   .stroke('#E0E0E0')
                   .moveDown(0.5);
            }

            // Add page numbers
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8)
                   .text(
                       `Page ${i + 1} of ${pageCount}`,
                       50,
                       doc.page.height - 50,
                       { align: 'center' }
                   );
            }

            // Finalize PDF
            doc.end();

            // Wait for PDF to be fully written
            await new Promise((resolve) => stream.on('finish', resolve));

            // Send file as a document
            const media = MessageMedia.fromFilePath(filePath);
            await msg.reply(media, null, { sendMediaAsDocument: true });
            
            // Cleanup the exported file
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error(error);
            logger.error(`Chat Export Error: ${error.message}`);
            msg.reply('Failed to export chat. Please try again later.');
        }
    }
};
