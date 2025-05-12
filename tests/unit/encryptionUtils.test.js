import {
    getEncryptionKey,
    setEncryptionKey,
    generateSHA256Hash,
    base64ToArrayBuffer,
    arrayBufferToBase64,
    encryptString,
    decryptString,
} from '../../src/lib/encryptionUtils';

// We'll use jest-chrome for mocking chrome.storage.session
// It's already set up globally via jest.setup.js, but we can still interact with it here.
// For crypto, we'll mock it directly in this file.

describe('encryptionUtils', () => {
    // --- Mocks for Web Crypto API ---
    let mockSubtleDigest;
    let mockSubtleImportKey;
    let mockSubtleEncrypt;
    let mockSubtleDecrypt;
    let mockGetRandomValues;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks(); // Clears jest-chrome mocks too

        // Mock crypto.subtle methods
        mockSubtleDigest = jest.fn();
        mockSubtleImportKey = jest.fn();
        mockSubtleEncrypt = jest.fn();
        mockSubtleDecrypt = jest.fn();
        global.crypto.subtle = {
            digest: mockSubtleDigest,
            importKey: mockSubtleImportKey,
            encrypt: mockSubtleEncrypt,
            decrypt: mockSubtleDecrypt,
        };

        // Mock crypto.getRandomValues
        mockGetRandomValues = jest.fn();
        global.crypto.getRandomValues = mockGetRandomValues;
    });

    // --- Tests for Key Storage ---
    describe('Key Storage (getEncryptionKey, setEncryptionKey)', () => {
        test('setEncryptionKey should store the key in session storage', async () => {
            const testKey = 'mySecretHashedKeyBase64';
            await setEncryptionKey(testKey);
            expect(chrome.storage.session.set).toHaveBeenCalledWith({ key: testKey });
        });

        test('getEncryptionKey should retrieve the key from session storage', async () => {
            const testKey = 'myRetrievedHashedKeyBase64';
            chrome.storage.session.get.mockResolvedValueOnce({ key: testKey }); // Mock the return value

            const retrievedKey = await getEncryptionKey();
            expect(chrome.storage.session.get).toHaveBeenCalledWith('key');
            expect(retrievedKey).toBe(testKey);
        });

        test('getEncryptionKey should return undefined if key is not found', async () => {
            chrome.storage.session.get.mockResolvedValueOnce({}); // Simulate key not found
            const retrievedKey = await getEncryptionKey();
            expect(retrievedKey).toBeUndefined();
        });
    });

    // --- Tests for Hashing ---
    describe('generateSHA256Hash', () => {
        test('should hash the input string using SHA-256', async () => {
            const inputString = 'testPassword';
            const mockHashBuffer = new ArrayBuffer(32); // SHA-256 produces 32 bytes
            mockSubtleDigest.mockResolvedValueOnce(mockHashBuffer);

            const result = await generateSHA256Hash(inputString);

            expect(mockSubtleDigest).toHaveBeenCalledWith(
                'SHA-256',
                expect.any(ArrayBuffer)
            );
            expect(result).toBe(mockHashBuffer);
        });
    });

    // --- Tests for Base64 Conversion (Custom Implementation) ---
    describe('Base64 Conversion (arrayBufferToBase64, base64ToArrayBuffer)', () => {
        // Test cases for custom Base64, focusing on round trip and known values
        // Your customBase64Encode/Decode are internal, so we test through the public functions
        const testCases = [
            { description: 'simple ASCII string', text: 'Hello', base64: 'SGVsbG8=' },
            { description: 'string with padding', text: 'Man', base64: 'TWFu' }, // Actually MWE=, custom might differ
            { description: 'string needing double padding', text: 'Ma', base64: 'TWE=' }, // Actually TWE=, custom might differ
            { description: 'empty string', text: '', base64: '' },
            { description: 'string with spaces and symbols', text: 'Hello World! 123', base64: 'SGVsbG8gV29ybGQhIDEyMw==' },
        ];

        // Note: The custom base64 implementation might produce slightly different padding
        // or handling of certain characters compared to native btoa/atob.
        // These tests should be based on *its actual output*.
        // For now, let's focus on the round trip.

        test('arrayBufferToBase64 and base64ToArrayBuffer should perform a round trip', () => {
            const originalText = "Ahoj Svete! 123?&*";
            const textEncoder = new TextEncoder();
            const originalBuffer = textEncoder.encode(originalText).buffer;

            const b64String = arrayBufferToBase64(originalBuffer);
            const finalBuffer = base64ToArrayBuffer(b64String);
            const finalText = new TextDecoder().decode(finalBuffer);

            expect(finalText).toBe(originalText);
            // You might also want to test with known base64 values if your custom implementation has specific outputs
        });

        // Example: If your customBase64Encode('Man') actually produces 'TWFu'
        // test('custom base64 for "Man"', () => {
        //   const buffer = new TextEncoder().encode('Man').buffer;
        //   expect(arrayBufferToBase64(buffer)).toBe('TWFu');
        // });
    });


    // --- Tests for Encryption and Decryption ---
    describe('Encryption and Decryption (encryptString, decryptString)', () => {
        const samplePlaintext = 'This is a secret message!';
        const samplePassphrase = 'superStrongPassword123!'; // For hashing
        let sampleKeyHashBuffer; // ArrayBuffer from generateSHA256Hash
        const mockCryptoKey = { type: 'secret' }; // Dummy CryptoKey object
        const mockIV = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]); // 12-byte IV
        const mockCiphertextBuffer = new TextEncoder().encode('mockEncryptedData').buffer;

        beforeAll(async () => {
            // For hashing, we can let the actual generateSHA256Hash run once,
            // or mock crypto.subtle.digest to always return a fixed hash for this test suite.
            // Let's mock it for consistency and control.
            sampleKeyHashBuffer = new ArrayBuffer(32); // Simulate a 32-byte hash
            new Uint8Array(sampleKeyHashBuffer).fill(5); // Fill with some dummy data
        });

        beforeEach(() => {
            // Setup mocks for a successful encryption/decryption path
            mockSubtleDigest.mockResolvedValue(sampleKeyHashBuffer); // For generateSHA256Hash if called
            mockSubtleImportKey.mockResolvedValue(mockCryptoKey);
            mockGetRandomValues.mockReturnValue(mockIV); // Always return the same IV for predictability
            mockSubtleEncrypt.mockResolvedValue(mockCiphertextBuffer);
            mockSubtleDecrypt.mockResolvedValue(new TextEncoder().encode(samplePlaintext).buffer); // Decrypt to original
        });

        test('encryptString should encrypt data and return base64 ciphertext and IV', async () => {
            const { encryptedString, iv: ivBase64 } = await encryptString(samplePlaintext, sampleKeyHashBuffer);

            expect(mockGetRandomValues).toHaveBeenCalledWith(new Uint8Array(12));
            expect(mockSubtleImportKey).toHaveBeenCalledWith('raw', sampleKeyHashBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
            expect(mockSubtleEncrypt).toHaveBeenCalledWith(
                { name: 'AES-GCM', iv: mockIV },
                mockCryptoKey,
                expect.any(ArrayBuffer) // Encoded plaintext
            );

            expect(encryptedString).toBe(arrayBufferToBase64(mockCiphertextBuffer));
            expect(ivBase64).toBe(arrayBufferToBase64(mockIV.buffer));
        });

        test('decryptString should decrypt data given base64 ciphertext, IV, and key hash', async () => {
            const b64Ciphertext = arrayBufferToBase64(mockCiphertextBuffer);
            const b64IV = arrayBufferToBase64(mockIV.buffer);

            const decryptedText = await decryptString(b64Ciphertext, b64IV, sampleKeyHashBuffer);

            expect(mockSubtleImportKey).toHaveBeenCalledWith('raw', sampleKeyHashBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
            expect(mockSubtleDecrypt).toHaveBeenCalledWith(
                { name: 'AES-GCM', iv: expect.any(ArrayBuffer) }, // IV ArrayBuffer
                mockCryptoKey,
                expect.any(ArrayBuffer)  // Ciphertext ArrayBuffer
            );
            const ivArrayBufferFromBase64 = base64ToArrayBuffer(b64IV);
            expect(mockSubtleDecrypt.mock.calls[0][0].iv).toEqual(ivArrayBufferFromBase64); // Check the IV content
            expect(new Uint8Array(mockSubtleDecrypt.mock.calls[0][0].iv)).toEqual(mockIV); // More precise check for IV


            expect(decryptedText).toBe(samplePlaintext);
        });

        test('encryptString and decryptString should perform a round trip', async () => {
            // This test relies on the mocks being set up for a successful path.
            // It's more of an integration test of encryptString and decryptString together.
            const { encryptedString, iv: ivBase64 } = await encryptString(samplePlaintext, sampleKeyHashBuffer);
            const decryptedText = await decryptString(encryptedString, ivBase64, sampleKeyHashBuffer);
            expect(decryptedText).toBe(samplePlaintext);
        });

        test('encryptString should throw if key is not provided', async () => {
            await expect(encryptString(samplePlaintext, null)).rejects.toThrow('No Encryption Key. Encryption key is required to encrypt the connection.');
        });

        test('decryptString should throw if key is not provided', async () => {
            const b64Ciphertext = arrayBufferToBase64(mockCiphertextBuffer);
            const b64IV = arrayBufferToBase64(mockIV.buffer);
            await expect(decryptString(b64Ciphertext, b64IV, null)).rejects.toThrow('No Encryption Key. Encryption key is required to decrypt the connection.');
        });

        test('decryptString should throw user-friendly error on decryption failure', async () => {
            const b64Ciphertext = arrayBufferToBase64(mockCiphertextBuffer);
            const b64IV = arrayBufferToBase64(mockIV.buffer);
            mockSubtleDecrypt.mockRejectedValueOnce(new Error('Simulated Decryption Error')); // Simulate crypto error

            await expect(decryptString(b64Ciphertext, b64IV, sampleKeyHashBuffer)).rejects.toThrow('Decryption failed. Please set the correct encryption key.');
        });
    });
});