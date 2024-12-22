export interface WhatsAppConfig {
    browser: {
        headless: boolean;
        viewport: {
            width: number;
            height: number;
        };
        userAgent: string;
    };
    monitoring: {
        checkInterval: number;
        maxMessages: number;
        skipNoMessageWait: boolean;
        pauseBot: boolean;
    };
    contact: {
        name: string;
    };
}

export interface ServerConfig {
    port: number;
}

export interface AIConfig {
    systemPrompt: string;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
}

export interface Config {
    whatsapp: WhatsAppConfig;
    server: ServerConfig;
    ai: AIConfig;
} 