const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

class WhatsAppBot {
    constructor() {
        this.browser = null;
        this.page = null;
        // Define the path for storing user data
        this.userDataDir = path.join(process.cwd(), 'whatsapp-session');
        console.log('WhatsAppBot instance created');
    }

    async initialize() {
        try {
            console.log('Launching browser...');
            // Launch browser with persistent context
            this.browser = await chromium.launchPersistentContext(this.userDataDir, {
                headless: false,
                viewport: { width: 1280, height: 800 }
            });

            console.log('Browser launched successfully');

            // Get the default page from the context
            const pages = this.browser.pages();
            this.page = pages[0] || await this.browser.newPage();
            this.page.setDefaultTimeout(0);
            console.log('Page created successfully with infinite timeout');

            // Only navigate to WhatsApp Web if we're not already there
            const currentUrl = this.page.url();
            if (!currentUrl.includes('web.whatsapp.com')) {
                console.log('Navigating to WhatsApp Web...');
                await this.page.goto('https://web.whatsapp.com');
                console.log('WhatsApp Web loaded');
            } else {
                console.log('Already on WhatsApp Web');
            }
            
            console.log('Waiting for search element to appear...');
            
            // Wait for WhatsApp to load (wait for the search element to appear)
            const searchSelector = 'div._aoq2._ai01 button[aria-label="Search or start new chat"]';
            await this.page.waitForSelector(searchSelector);
            console.log('Successfully logged in! Search element is visible');
        } catch (error) {
            console.error('Error during initialization:', {
                step: error.message.includes('Search or start new chat') ? 'waiting for search element' : 'browser setup',
                error: error.message
            });
            throw error;
        }
    }

    async findAndOpenChat(contactName) {
        try {
            console.log(`Attempting to find chat with contact: ${contactName}`);
            
            const searchSelector = 'div._aoq2._ai01 button[aria-label="Search or start new chat"]';
            console.log('Clicking search button...');
            await this.page.click(searchSelector);
            console.log('Search button clicked');
            
            console.log('Filling search input...');
            const searchInputSelector = 'div[role="textbox"][contenteditable="true"][data-tab="3"]';
            await this.page.waitForSelector(searchInputSelector);
            await this.page.fill(searchInputSelector, contactName);
            console.log('Search input filled');
            
            // Add a small delay to let search results load
            console.log('Waiting for search results to load...');
            await this.page.waitForTimeout(5000);
            
            // Find all contacts and match the exact name
            console.log('Looking for contact with exact name match...');
            const contacts = await this.page.$$('div[role="listitem"]');
            let targetContact = null;

            for (const contact of contacts) {
                const nameElement = await contact.$('span[title]');
                if (nameElement) {
                    const title = await nameElement.getAttribute('title');
                    if (title && title.toLowerCase() === contactName.toLowerCase()) {
                        targetContact = contact;
                        break;
                    }
                }
            }

            if (!targetContact) {
                throw new Error(`Contact "${contactName}" not found in search results`);
            }

            console.log(`Found contact: ${contactName}`);
            await targetContact.click();
            console.log('Successfully clicked contact');

            // Wait for chat to load with the new selector
            console.log('Waiting for chat to load...');
            const chatInputSelector = 'div[contenteditable="true"][role="textbox"][data-lexical-editor="true"]';
            await this.page.waitForSelector(chatInputSelector);
            console.log('Chat loaded successfully');
        } catch (error) {
            console.error('Error finding/opening chat:', {
                contact: contactName,
                step: error.message.includes('Search or start new chat') ? 'clicking search' :
                      error.message.includes('not found in search results') ? 'finding contact' :
                      error.message.includes('textbox') ? 'loading chat' : 'unknown',
                error: error.message
            });
            throw error;
        }
    }

    async getLastMessages(count = 50) {
        try {
            console.log(`Attempting to fetch last ${count} messages...`);
            const messages = await this.page.evaluate((count) => {
                console.log('Evaluating messages in browser context...');
                const messageElements = document.querySelectorAll('div.message-in, div.message-out');
                console.log(`Found ${messageElements.length} total messages`);
                
                const messages = [];
                const startIndex = Math.max(0, messageElements.length - count);
                console.log(`Starting from index ${startIndex}`);
                
                for (let i = messageElements.length - 1; i >= startIndex; i--) {
                    const element = messageElements[i];
                    const text = element.querySelector('span.selectable-text')?.innerText;
                    const isOutgoing = element.classList.contains('message-out');
                    
                    if (text) {
                        messages.unshift({
                            text,
                            isOutgoing
                        });
                    }
                }
                
                console.log(`Processed ${messages.length} messages`);
                return messages;
            }, count);
            
            console.log(`Successfully retrieved ${messages.length} messages`);
            return messages;
        } catch (error) {
            console.error('Error getting messages:', {
                error: error.message,
                requestedCount: count
            });
            throw error;
        }
    }

    async sendMessage(message) {
        try {
            console.log('Attempting to send message...');
            
            const chatInputSelector = 'div[contenteditable="true"][role="textbox"][data-lexical-editor="true"]';
            // Wait for elements to be present
            await this.page.waitForSelector(chatInputSelector);
            
            // Get all matching elements and select the second one
            const inputElements = await this.page.$$(chatInputSelector);
            if (inputElements.length < 2) {
                throw new Error('Could not find the message input field');
            }
            const messageInput = inputElements[1]; // Get the second element
            
            console.log('Filling message input...');
            await messageInput.fill(message);
            
            // Use Cmd+Enter to send the message
            await messageInput.press('Meta+Enter');
            console.log('Message sent successfully:', message);
        } catch (error) {
            console.error('Error sending message:', {
                error: error.message,
                messageLength: message.length
            });
            throw error;
        }
    }

    async close() {
        try {
            if (this.browser) {
                console.log('Closing browser context...');
                await this.browser.close();
                console.log('Browser context closed successfully');
            }
        } catch (error) {
            console.error('Error closing browser:', error.message);
            throw error;
        }
    }
}

module.exports = WhatsAppBot; 