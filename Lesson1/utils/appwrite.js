import { Client, Account } from 'appwrite';

// Initialize Appwrite client
const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite Endpoint
    .setProject('668'); // Your project ID

// Export the account instance
export const account = new Account(client);

// Export the client for other services
export const appwriteClient = client;