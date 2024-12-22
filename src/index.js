require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WhatsAppBot = require('./whatsappBot');
const AIHandler = require('./aiHandler');
const configManager = require('./configManager');

const app = express();
const port = process.env.PORT || 3010;

// Enable CORS for the Next.js frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
}));

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

// Configuration endpoints
app.get('/config', async (req, res) => {
    try {
        const config = await configManager.loadConfig();
        res.json(config);
    } catch (error) {
        console.error('Error loading config:', error);
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

app.post('/config', async (req, res) => {
    try {
        const newConfig = await configManager.saveConfig(req.body);
        // Restart the bot with new configuration
        if (whatsappBot) {
            console.log('Restarting bot with new configuration...');
            monitoringActive = false;
            await whatsappBot.close();
            whatsappBot = null;
            aiHandler = null;
            await initialize();
        }
        res.json(newConfig);
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// Add session directory cleanup on process exit
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    if (whatsappBot) {
        await whatsappBot.close();
    }
    process.exit(0);
});

async function initialize() {
    try {
        // Load configuration
        await configManager.loadConfig();
        const config = configManager.getConfig();

        console.log('Initializing WhatsApp bot...');
        whatsappBot = new WhatsAppBot();
        await whatsappBot.initialize();

        console.log('Initializing AI handler...');
        aiHandler = new AIHandler();

        console.log('Finding and opening chat...');
        await whatsappBot.findAndOpenChat(config.whatsapp.contact.name);

        console.log('Starting message monitoring...');
        monitoringActive = true;
        await startMessageMonitoring();
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
}

async function startMessageMonitoring() {
    try {
        console.log('Starting message monitoring cycle...');
        const config = configManager.getConfig();
        let lastMessageCount = 0;
        let lastMessageText = '';

        while (monitoringActive) {
            const currentTime = new Date().toISOString();
            console.log(`[${currentTime}] Checking for new messages...`);
            
            console.log('Fetching last messages...');
            const messages = await whatsappBot.getLastMessages(config.whatsapp.monitoring.maxMessages);
            
            // Check if there are new messages and if the last message is from Person A (not the bot)
            const hasNewMessages = messages.length > lastMessageCount;
            const lastMessage = messages[messages.length - 1];
            const isNewPersonAMessage = hasNewMessages && 
                                      !lastMessage.isOutgoing && 
                                      lastMessage.text !== lastMessageText;

            if (isNewPersonAMessage || config.whatsapp.monitoring.skipNoMessageWait) {
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
            
            // Wait for configured interval before next check
            await new Promise(resolve => setTimeout(resolve, config.whatsapp.monitoring.checkInterval));
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
        await initialize();
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
    initialize();
}); 