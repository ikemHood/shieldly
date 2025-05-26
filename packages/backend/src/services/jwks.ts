import { generateKeyPairSync, createSign, createVerify } from 'crypto';
import { randomBytes } from 'crypto';

export interface JWK {
    kty: string;
    use: string;
    kid: string;
    alg: string;
    n: string;
    e: string;
}

export interface JWKS {
    keys: JWK[];
}

export interface KeyPair {
    kid: string;
    publicKey: string;
    privateKey: string;
    algorithm: string;
    createdAt: Date;
}

class JWKSService {
    private keyPairs: Map<string, KeyPair> = new Map();
    private currentKeyId: string | null = null;

    constructor() {
        // Generate initial key pair on startup
        this.generateNewKeyPair();
    }

    /**
     * Generate a new RSA key pair for JWT signing
     */
    generateNewKeyPair(): string {
        const kid = this.generateKeyId();

        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        const keyPair: KeyPair = {
            kid,
            publicKey,
            privateKey,
            algorithm: 'RS256',
            createdAt: new Date()
        };

        this.keyPairs.set(kid, keyPair);
        this.currentKeyId = kid;

        console.log(`Generated new RSA key pair with kid: ${kid}`);
        return kid;
    }

    /**
     * Get the current active key pair for signing
     */
    getCurrentKeyPair(): KeyPair | null {
        if (!this.currentKeyId) return null;
        return this.keyPairs.get(this.currentKeyId) || null;
    }

    /**
     * Get a specific key pair by kid
     */
    getKeyPair(kid: string): KeyPair | null {
        return this.keyPairs.get(kid) || null;
    }

    /**
     * Get all public keys in JWKS format
     */
    getJWKS(): JWKS {
        const keys: JWK[] = [];

        for (const [kid, keyPair] of this.keyPairs) {
            const jwk = this.publicKeyToJWK(keyPair.publicKey, kid);
            keys.push(jwk);
        }

        return { keys };
    }

    /**
     * Convert PEM public key to JWK format
     */
    private publicKeyToJWK(publicKeyPem: string, kid: string): JWK {
        // Remove PEM headers and decode base64
        const publicKeyDer = publicKeyPem
            .replace(/-----BEGIN PUBLIC KEY-----/, '')
            .replace(/-----END PUBLIC KEY-----/, '')
            .replace(/\s/g, '');

        const publicKeyBuffer = Buffer.from(publicKeyDer, 'base64');

        // Parse the DER-encoded public key to extract n and e
        // This is a simplified parser for RSA public keys in SPKI format
        const { n, e } = this.parseRSAPublicKey(publicKeyBuffer);

        return {
            kty: 'RSA',
            use: 'sig',
            kid,
            alg: 'RS256',
            n: n.toString('base64url'),
            e: e.toString('base64url')
        };
    }

    /**
     * Parse RSA public key from DER format to extract modulus (n) and exponent (e)
     */
    private parseRSAPublicKey(der: Buffer): { n: Buffer; e: Buffer } {
        let offset = 0;

        // Skip SEQUENCE tag and length
        if (der[offset] !== 0x30) throw new Error('Invalid DER format');
        offset++;

        // Skip length bytes
        const lengthByte = der[offset++];
        if (lengthByte & 0x80) {
            const lengthBytes = lengthByte & 0x7f;
            offset += lengthBytes;
        }

        // Skip algorithm identifier SEQUENCE
        if (der[offset] !== 0x30) throw new Error('Invalid DER format');
        offset++;
        const algIdLengthByte = der[offset++];
        if (algIdLengthByte & 0x80) {
            const algIdLengthBytes = algIdLengthByte & 0x7f;
            offset += algIdLengthBytes;
        } else {
            offset += algIdLengthByte;
        }

        // Skip BIT STRING tag and unused bits
        if (der[offset] !== 0x03) throw new Error('Invalid DER format');
        offset++;
        const bitStringLengthByte = der[offset++];
        if (bitStringLengthByte & 0x80) {
            const bitStringLengthBytes = bitStringLengthByte & 0x7f;
            offset += bitStringLengthBytes;
        }
        offset++; // Skip unused bits byte

        // Now we're at the RSA public key SEQUENCE
        if (der[offset] !== 0x30) throw new Error('Invalid DER format');
        offset++;
        const rsaSeqLengthByte = der[offset++];
        if (rsaSeqLengthByte & 0x80) {
            const rsaSeqLengthBytes = rsaSeqLengthByte & 0x7f;
            offset += rsaSeqLengthBytes;
        }

        // Read modulus (n)
        if (der[offset] !== 0x02) throw new Error('Invalid DER format');
        offset++;
        const nLengthByte = der[offset++];
        let nLength: number;
        if (nLengthByte & 0x80) {
            const nLengthBytes = nLengthByte & 0x7f;
            nLength = 0;
            for (let i = 0; i < nLengthBytes; i++) {
                nLength = (nLength << 8) | der[offset++];
            }
        } else {
            nLength = nLengthByte;
        }

        // Skip leading zero if present
        if (der[offset] === 0x00) {
            offset++;
            nLength--;
        }

        const n = der.subarray(offset, offset + nLength);
        offset += nLength;

        // Read exponent (e)
        if (der[offset] !== 0x02) throw new Error('Invalid DER format');
        offset++;
        const eLengthByte = der[offset++];
        let eLength: number;
        if (eLengthByte & 0x80) {
            const eLengthBytes = eLengthByte & 0x7f;
            eLength = 0;
            for (let i = 0; i < eLengthBytes; i++) {
                eLength = (eLength << 8) | der[offset++];
            }
        } else {
            eLength = eLengthByte;
        }

        const e = der.subarray(offset, offset + eLength);

        return { n, e };
    }

    /**
     * Generate a unique key ID
     */
    private generateKeyId(): string {
        return randomBytes(16).toString('hex');
    }

    /**
     * Rotate keys (generate new key pair and keep old ones for verification)
     */
    rotateKeys(): string {
        const newKid = this.generateNewKeyPair();

        return newKid;
    }

    /**
     * Clean up old keys (remove keys older than specified days)
     */
    cleanupOldKeys(maxAgeDays: number = 30): void {
        const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

        for (const [kid, keyPair] of this.keyPairs) {
            if (keyPair.createdAt < cutoffDate && kid !== this.currentKeyId) {
                this.keyPairs.delete(kid);
                console.log(`Cleaned up old key pair with kid: ${kid}`);
            }
        }
    }
}

// Export singleton instance
export const jwksService = new JWKSService(); 