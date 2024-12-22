'use client';

import { useState, useEffect } from 'react';
import { Config } from '../types/config';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
    const [config, setConfig] = useState<Config | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setStatus('loading');
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error('Failed to fetch configuration');
            }
            const data = await response.json();
            setConfig(data);
            setStatus('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
            setStatus('error');
        }
    };

    const updateConfig = async (newConfig: Config) => {
        try {
            setStatus('loading');
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newConfig),
            });
            if (!response.ok) {
                throw new Error('Failed to update configuration');
            }
            const data = await response.json();
            setConfig(data);
            setStatus('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update configuration');
            setStatus('error');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (config) {
            updateConfig(config);
        }
    };

    const isLoading = status === 'loading';

    if (!config || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">{isLoading ? 'Loading...' : 'Initializing...'}</div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <div className="text-red-500 text-lg mb-4">{error}</div>
                <button 
                    onClick={fetchConfig}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">WhatsApp Bot Configuration</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={fetchConfig}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                            type="button"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Browser Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Browser Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={config.whatsapp.browser.headless}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            whatsapp: {
                                                ...config.whatsapp,
                                                browser: {
                                                    ...config.whatsapp.browser,
                                                    headless: e.target.checked
                                                }
                                            }
                                        })}
                                        className="form-checkbox h-5 w-5 text-blue-500"
                                    />
                                    <span>Headless Mode</span>
                                </label>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Viewport Width</label>
                                    <input
                                        type="number"
                                        value={config.whatsapp.browser.viewport.width}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            whatsapp: {
                                                ...config.whatsapp,
                                                browser: {
                                                    ...config.whatsapp.browser,
                                                    viewport: {
                                                        ...config.whatsapp.browser.viewport,
                                                        width: parseInt(e.target.value) || 0
                                                    }
                                                }
                                            }
                                        })}
                                        className="w-full p-2 border rounded"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Viewport Height</label>
                                    <input
                                        type="number"
                                        value={config.whatsapp.browser.viewport.height}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            whatsapp: {
                                                ...config.whatsapp,
                                                browser: {
                                                    ...config.whatsapp.browser,
                                                    viewport: {
                                                        ...config.whatsapp.browser.viewport,
                                                        height: parseInt(e.target.value) || 0
                                                    }
                                                }
                                            }
                                        })}
                                        className="w-full p-2 border rounded"
                                        min="0"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">User Agent</label>
                                <input
                                    type="text"
                                    value={config.whatsapp.browser.userAgent}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        whatsapp: {
                                            ...config.whatsapp,
                                            browser: {
                                                ...config.whatsapp.browser,
                                                userAgent: e.target.value
                                            }
                                        }
                                    })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Monitoring Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Monitoring Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Check Interval (ms)</label>
                                <input
                                    type="number"
                                    value={config.whatsapp.monitoring.checkInterval}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        whatsapp: {
                                            ...config.whatsapp,
                                            monitoring: {
                                                ...config.whatsapp.monitoring,
                                                checkInterval: parseInt(e.target.value) || 0
                                            }
                                        }
                                    })}
                                    className="w-full p-2 border rounded"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Max Messages</label>
                                <input
                                    type="number"
                                    value={config.whatsapp.monitoring.maxMessages}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        whatsapp: {
                                            ...config.whatsapp,
                                            monitoring: {
                                                ...config.whatsapp.monitoring,
                                                maxMessages: parseInt(e.target.value) || 0
                                            }
                                        }
                                    })}
                                    className="w-full p-2 border rounded"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Contact Settings</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Contact Name</label>
                            <input
                                type="text"
                                value={config.whatsapp.contact.name}
                                onChange={(e) => setConfig({
                                    ...config,
                                    whatsapp: {
                                        ...config.whatsapp,
                                        contact: {
                                            ...config.whatsapp.contact,
                                            name: e.target.value
                                        }
                                    }
                                })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    {/* Server Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Server Settings</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Port</label>
                            <input
                                type="number"
                                value={config.server.port}
                                onChange={(e) => setConfig({
                                    ...config,
                                    server: {
                                        ...config.server,
                                        port: parseInt(e.target.value) || 0
                                    }
                                })}
                                className="w-full p-2 border rounded"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            {status === 'success' && 'Changes saved successfully'}
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
} 