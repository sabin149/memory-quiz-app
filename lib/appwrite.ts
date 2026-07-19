import { Account, Client } from 'react-native-appwrite';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error(
    'Missing Appwrite configuration. Copy .env.example to .env and set EXPO_PUBLIC_APPWRITE_ENDPOINT and EXPO_PUBLIC_APPWRITE_PROJECT_ID.'
  );
}

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setPlatform('com.mycompany.memoryquizapp');

export const account = new Account(client);
