const OpenAI = require('openai');
const configManager = require('./configManager');

class AIHandler {
    constructor() {
        // Validate environment variables
        this.validateConfig();
        
        const baseURL = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`;
        console.log('Initializing AIHandler with:', {
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION,
            baseURL
        });

        this.openai = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL,
            defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
            defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
        });
        console.log('AIHandler instance created with Azure OpenAI');
    }

    validateConfig() {
        const requiredEnvVars = [
            'AZURE_OPENAI_API_KEY',
            'AZURE_OPENAI_ENDPOINT',
            'AZURE_OPENAI_API_VERSION',
            'AZURE_OPENAI_DEPLOYMENT_NAME'
        ];

        const missing = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Validate endpoint URL
        if (!process.env.AZURE_OPENAI_ENDPOINT.startsWith('http')) {
            throw new Error('AZURE_OPENAI_ENDPOINT must start with http:// or https://');
        }
    }

    async generateResponse(messages) {
        try {
            console.log('Preparing conversation for AI...');
            const conversation = messages.map(msg => ({
                role: msg.isOutgoing ? 'assistant' : 'user',
                content: msg.text
            }));
            console.log(`Prepared ${conversation.length} messages for AI`);
            console.log(conversation);

            const config = configManager.getConfig();
            const aiConfig = config.ai;

            console.log('Requesting AI response...');
            const response = await this.openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: aiConfig.systemPrompt
                    },
                    ...conversation,
                ],
                temperature: aiConfig.temperature,
                top_p: aiConfig.topP,
                frequency_penalty: aiConfig.frequencyPenalty,
                presence_penalty: aiConfig.presencePenalty,
                max_tokens: aiConfig.maxTokens,
                stop: null
            });
            console.log('Received AI response successfully');

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating AI response:', {
                error: error.message,
                messageCount: messages.length
            });
            throw error;
        }
    }
}

module.exports = AIHandler; 