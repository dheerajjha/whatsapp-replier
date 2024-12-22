import React from 'react';
import { AIConfig } from '../../types/config';

interface AISettingsProps {
    config: AIConfig;
    onUpdate: (newConfig: AIConfig) => void;
    isLoading?: boolean;
}

const AISettings: React.FC<AISettingsProps> = ({ config, onUpdate, isLoading = false }) => {
    const handleChange = (field: keyof AIConfig, value: string | number) => {
        const newConfig = { ...config };
        if (field === 'systemPrompt') {
            newConfig[field] = value as string;
        } else {
            newConfig[field] = Number(value);
        }
        onUpdate(newConfig);
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">AI Configuration</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        System Prompt
                    </label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={config.systemPrompt}
                        onChange={(e) => handleChange('systemPrompt', e.target.value)}
                        rows={4}
                        disabled={isLoading}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperature ({config.temperature})
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={config.temperature}
                            onChange={(e) => handleChange('temperature', e.target.value)}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Top P ({config.topP})
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={config.topP}
                            onChange={(e) => handleChange('topP', e.target.value)}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency Penalty ({config.frequencyPenalty})
                        </label>
                        <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={config.frequencyPenalty}
                            onChange={(e) => handleChange('frequencyPenalty', e.target.value)}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Presence Penalty ({config.presencePenalty})
                        </label>
                        <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={config.presencePenalty}
                            onChange={(e) => handleChange('presencePenalty', e.target.value)}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Tokens
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="4000"
                            value={config.maxTokens}
                            onChange={(e) => handleChange('maxTokens', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AISettings; 