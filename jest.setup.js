// jest.setup.js
import 'jest-chrome'; // Automatically mocks chrome.* APIs

// --- Mock the global 'solace' object ---
// Create a basic structure mimicking the solace client library API
// We use jest.fn() for methods we might want to spy on or mock implementations for in specific tests.
const mockSolace = {
  SolclientFactoryProperties: class { // Mock class
    constructor() {
      this.profile = null;
      // Add other properties if needed by your code
    }
  },
  SolclientFactoryProfiles: { // Mock enum/object
    version10: 'mockVersion10Profile', // Use distinct mock values
    // Add other profiles if used
  },
  SolclientFactory: { // Mock static object/class
    init: jest.fn(),
    createSession: jest.fn(() => ({ // createSession returns a mock session object
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      dispose: jest.fn(),
      createQueueBrowser: jest.fn(() => ({ // createQueueBrowser returns a mock browser object
        on: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        // Mock methods/properties of the queue browser if used
      })),
      // Mock other session methods/properties if used
    })),
  },
  SessionEventCode: { // Mock enum/object for events
    UP_NOTICE: 'UP_NOTICE',
    DISCONNECTED: 'DISCONNECTED',
    CONNECT_FAILED_ERROR: 'CONNECT_FAILED_ERROR',
    // Add other event codes used
  },
  QueueBrowserEventName: { // Mock enum/object for QB events
    UP: 'UP',
    DOWN: 'DOWN',
    CONNECT_FAILED_ERROR: 'CONNECT_FAILED_ERROR',
    MESSAGE: 'MESSAGE',
    // Add other event names used
  },
  ErrorSubcode: { // Mock enum/object for error subcodes
    MESSAGE_VPN_NOT_ALLOWED: 1,
    LOGIN_FAILURE: 2,
    CLIENT_ACL_DENIED: 3,
    // Add other subcodes used
  },
  // Add other top-level solace properties/methods if directly used
};

// Assign the mock to the global scope (or 'self' if needed, Jest usually uses 'global')
// Since your code uses `self.solace`, we should try assigning to `self` or ensure `global.self` exists.
// `global` is standard in Jest's Node environment. JSDOM provides `self`.
// Let's assign to both for robustness, though `global` is likely sufficient in Jest setup.
global.solace = mockSolace;
if (typeof self !== 'undefined') {
  self.solace = mockSolace;
}

// --- Mock other potential globals if necessary ---
// Example: Mocking crypto.subtle digest if needed globally, though often mocked per test
// global.crypto = {
//   subtle: {
//     digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)), // Example mock
//     // Mock other subtle methods if needed
//   },
//   getRandomValues: jest.fn((array) => { // Example mock for IVs
//     for (let i = 0; i < array.length; i++) {
//       array[i] = i; // Fill with predictable values for testing
//     }
//     return array;
//   }),
// };

// You can add other global setup here, e.g., mocking fetch:
// global.fetch = jest.fn();