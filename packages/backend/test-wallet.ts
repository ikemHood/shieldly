import { ChipiSDK } from '@chipi-pay/chipi-sdk';
import env from './src/env';

// Initialize the ChipiSDK for wallet operations
const chipiSDK = new ChipiSDK({
    apiPublicKey: env.apiKey,
});

const wallet = await chipiSDK.createWallet({
    encryptKey: "123456",
    bearerToken: `Bearer`,
});

console.log(wallet);