import dotenv from "dotenv";

dotenv.config();


export default {
    port: process.env.PORT || 3000,
    dbUrl: process.env.DB_URL || "postgresql://postgres:postgres@localhost:5432/shieldly",
    nodeUrl: process.env.NODE_URL || "https://devnet.chipi.io",
    apiKey: process.env.API_KEY || "your-api-key",
    secretKey: process.env.SECRET_KEY || "your-secret-key",
    appId: process.env.APP_ID || "your-app-id",
    jwtSecret: process.env.JWT_SECRET || "your-jwt-secret",
    kycProviderUrl: process.env.KYC_PROVIDER_URL || "https://kyc-provider.example.com",
    kycApiKey: process.env.KYC_API_KEY || "your-kyc-api-key",
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
    },
    resendApiKey: process.env.RESEND_API_KEY || "your-resend-api-key",
    emailFrom: process.env.EMAIL_FROM || "your-email-from"
}

