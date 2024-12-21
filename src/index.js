require('dotenv').config();
const express = require('express');
const WhatsAppBot = require('./whatsappBot');
const AIHandler = require('./aiHandler');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize WhatsApp bot and AI Handler
let whatsappBot = null;
let aiHandler = null;
let monitoringActive = false;

// Add debug logging
console.log('Environment variables loaded:', {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    hasApiKey: !!process.env.AZURE_OPENAI_API_KEY
});

// Add session directory cleanup on process exit
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    if (whatsappBot) {
        await whatsappBot.close();
    }
    process.exit(0);
});

async function initializeBot() {
    try {
        console.log('Starting bot initialization...');
        console.log('Creating new WhatsAppBot instance...');
        whatsappBot = new WhatsAppBot();
        aiHandler = new AIHandler();
        
        console.log('Initializing WhatsApp connection...');
        await whatsappBot.initialize();
        
        console.log(`Finding and opening chat with ${process.env.TARGET_CONTACT_NAME}...`);
        await whatsappBot.findAndOpenChat(process.env.TARGET_CONTACT_NAME);
        
        // console.log('Sending initial greeting message...');
        // await whatsappBot.sendMessage('Hi');
        
        console.log('Starting message monitoring loop...');
        if (!monitoringActive) {
            monitoringActive = true;
            startMessageMonitoring();
        }
    } catch (error) {
        console.error('Failed to initialize bot:', {
            step: error.message.includes('initialize') ? 'initialization' :
                  error.message.includes('findAndOpenChat') ? 'finding chat' :
                  error.message.includes('sendMessage') ? 'sending message' : 'unknown',
            error: error.message
        });
    }
}

async function startMessageMonitoring() {
    try {
        console.log('Starting message monitoring cycle...');
        let lastMessageCount = 0;
        let lastMessageText = '';

        while (monitoringActive) {
            const currentTime = new Date().toISOString();
            console.log(`[${currentTime}] Checking for new messages...`);
            
            console.log('Fetching last messages...');
            const messages = await whatsappBot.getLastMessages(50);
            
            // Check if there are new messages and if the last message is from Person A (not the bot)
            const hasNewMessages = messages.length > lastMessageCount;
            const lastMessage = messages[messages.length - 1];
            const isNewPersonAMessage = hasNewMessages && 
                                      !lastMessage.isOutgoing && 
                                      lastMessage.text !== lastMessageText;

            if (isNewPersonAMessage) {
                console.log(`[${currentTime}] New message detected from Person A:`, lastMessage.text);
                lastMessageCount = messages.length;
                lastMessageText = lastMessage.text;

                console.log('Generating AI response...');
                const aiResponse = await aiHandler.generateResponse(messages);
                console.log('AI response generated:', aiResponse);

                console.log('Sending AI response...');
                await whatsappBot.sendMessage(aiResponse);
                console.log(`[${currentTime}] AI response sent successfully`);
            } else {
                console.log(`[${currentTime}] No new messages from Person A`);
            }
            
            // Wait for 2 seconds before next check (reduced from 5 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in message monitoring:`, {
            error: error.message,
            step: error.message.includes('getLastMessages') ? 'fetching messages' :
                  error.message.includes('generateResponse') ? 'generating response' :
                  error.message.includes('sendMessage') ? 'sending message' : 'unknown'
        });
        monitoringActive = false;
    }
}

// API endpoints for future frontend integration
app.get('/status', (req, res) => {
    console.log('Status endpoint called');
    const status = {
        botInitialized: whatsappBot !== null && aiHandler !== null,
        monitoringActive: monitoringActive
    };
    console.log('Current status:', status);
    res.json(status);
});

app.post('/restart', async (req, res) => {
    console.log('Restart endpoint called');
    try {
        if (whatsappBot) {
            console.log('Closing existing bot instance...');
            monitoringActive = false;
            await whatsappBot.close();
            whatsappBot = null;
            aiHandler = null;
        }
        
        console.log('Initializing new bot instance...');
        await initializeBot();
        res.json({ status: 'restarting' });
    } catch (error) {
        console.error('Error during restart:', error);
        res.status(500).json({ error: 'Failed to restart bot' });
    }
});

// Start the server and bot
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Starting initial bot setup...');
    initializeBot();
}); 