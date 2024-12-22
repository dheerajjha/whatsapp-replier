const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(process.cwd(), 'config', 'settings.json');
        this.config = null;
    }

    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            this.config = JSON.parse(configData);
            return this.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw error;
        }
    }

    async saveConfig(newConfig) {
        try {
            await fs.writeFile(this.configPath, JSON.stringify(newConfig, null, 4), 'utf8');
            this.config = newConfig;
            return this.config;
        } catch (error) {
            console.error('Error saving configuration:', error);
            throw error;
        }
    }

    async updateConfig(partialConfig) {
        const currentConfig = await this.loadConfig();
        const updatedConfig = this.mergeConfigs(currentConfig, partialConfig);
        return this.saveConfig(updatedConfig);
    }

    mergeConfigs(currentConfig, newConfig) {
        const merged = { ...currentConfig };
        
        for (const [key, value] of Object.entries(newConfig)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                merged[key] = this.mergeConfigs(currentConfig[key] || {}, value);
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    getConfig() {
        return this.config;
    }
}

module.exports = new ConfigManager(); 