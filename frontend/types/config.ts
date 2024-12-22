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
    };
    contact: {
        name: string;
    };
}

export interface ServerConfig {
    port: number;
}

export interface Config {
    whatsapp: WhatsAppConfig;
    server: ServerConfig;
} 