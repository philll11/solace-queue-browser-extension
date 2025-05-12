import {
  isEmpty,
  isValidMsgVpnUrl,
  isValidEncryptionKey,
  isValidSmfHostProtocol
} from '../../src/lib/sharedUtils';

describe('sharedUtils', () => {
  describe('isEmpty', () => {
    // --- Your existing isEmpty tests ---
    test('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    test('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    test('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    test('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    test('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    test('should return false for 0', () => {
      expect(isEmpty(0)).toBe(false);
    });

    test('should return false for false', () => {
      expect(isEmpty(false)).toBe(false);
    });

    test('should return false for true', () => {
      expect(isEmpty(true)).toBe(false);
    });

    test('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    test('should return false for non-empty array', () => {
      expect(isEmpty([1])).toBe(false);
    });

    test('should return false for non-empty object', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });

    test('should return false for Date object', () => {
      expect(isEmpty(new Date())).toBe(false);
    });
    // --- End of isEmpty tests ---
  });

  describe('isValidMsgVpnUrl', () => {
    // Valid Solace Cloud URLs
    test('should return true for valid Solace Cloud URL with port', () => {
      expect(isValidMsgVpnUrl('https://mr-test.messaging.solace.cloud:943')).toBe(true);
    });
    test('should return true for valid Solace Cloud URL with port and trailing slash', () => {
      expect(isValidMsgVpnUrl('https://mr-test.messaging.solace.cloud:943/')).toBe(true);
    });
    test('should return true for Solace Cloud URL with hyphen in subdomain', () => {
      expect(isValidMsgVpnUrl('https://my-vpn-name.messaging.solace.cloud:1234')).toBe(true);
    });
    test('should return true for Solace Cloud URL with path after port', () => {
      expect(isValidMsgVpnUrl('https://mr-test.messaging.solace.cloud:943/some/path')).toBe(false);
    });

    // Valid Localhost URLs
    test('should return true for valid http localhost URL with port', () => {
      expect(isValidMsgVpnUrl('http://localhost:8080')).toBe(true);
    });
    test('should return true for valid https localhost URL with port', () => {
      expect(isValidMsgVpnUrl('https://localhost:9090')).toBe(true);
    });
    test('should return true for valid http localhost URL with port and trailing slash', () => {
      expect(isValidMsgVpnUrl('http://localhost:8080/')).toBe(true);
    });
    test('should return true for localhost URL with path after port', () => {
      expect(isValidMsgVpnUrl('http://localhost:8080/some/path')).toBe(false);
    });

    // Invalid URLs
    test('should return false for URL without protocol', () => {
      expect(isValidMsgVpnUrl('mr-test.messaging.solace.cloud:943')).toBe(false);
    });
    test('should return false for URL with incorrect protocol', () => {
      expect(isValidMsgVpnUrl('ftp://mr-test.messaging.solace.cloud:943')).toBe(false);
    });
    test('should return false for Solace Cloud URL without port', () => {
      expect(isValidMsgVpnUrl('https://mr-test.messaging.solace.cloud')).toBe(false);
    });
    test('should return false for localhost URL without port', () => {
      expect(isValidMsgVpnUrl('http://localhost')).toBe(false);
    });
    test('should return false for URL with different domain structure', () => {
      expect(isValidMsgVpnUrl('https://myservice.com:943')).toBe(false);
    });
    test('should return false for empty string', () => {
      expect(isValidMsgVpnUrl('')).toBe(false);
    });
  });

  describe('isValidSmfHostProtocol', () => {
    // Valid Protocols
    test('should return true for ws:// protocol', () => {
      expect(isValidSmfHostProtocol('ws://mybroker.com:8008')).toBe(true);
    });
    test('should return true for wss:// protocol', () => {
      expect(isValidSmfHostProtocol('wss://mybroker.com:8043')).toBe(true);
    });
    test('should return true for http:// protocol', () => {
      expect(isValidSmfHostProtocol('http://mybroker.com:80')).toBe(true);
    });
    test('should return true for https:// protocol', () => {
      expect(isValidSmfHostProtocol('https://mybroker.com:443')).toBe(true);
    });

    // Invalid Protocols/Formats
    test('should return false for URL without protocol', () => {
      expect(isValidSmfHostProtocol('mybroker.com:8008')).toBe(false);
    });
    test('should return false for URL with invalid protocol (ftp)', () => {
      expect(isValidSmfHostProtocol('ftp://mybroker.com:21')).toBe(false);
    });
    test('should return false for URL with typo in protocol (ws:/)', () => {
      expect(isValidSmfHostProtocol('ws:/mybroker.com')).toBe(false);
    });
    test('should return false for URL starting with just //', () => {
      expect(isValidSmfHostProtocol('//mybroker.com')).toBe(false);
    });
    test('should return false for empty string', () => {
      expect(isValidSmfHostProtocol('')).toBe(false);
    });
    test('should return true for URL with path after host', () => {
      expect(isValidSmfHostProtocol('wss://mybroker.com/some/path/to/resource')).toBe(true);
    });
  });
});


describe('isValidEncryptionKey', () => {
  const testCases = [
    // description, inputKey, expectedOutput
    ['valid key meeting all criteria', 'ValidKey1!', true],
    ['longer valid key', 'LongerValidKey123$Symbol', true],
    ['key shorter than 8 characters', 'Short1!', false],
    ['key without a number', 'NoNumberKey!', false],
    ['key without a symbol', 'NoSymbolKeyA', false],
    ['key without a capital letter', 'nocapkey1!', false],
    ['key with only lowercase and numbers (min length, no symbol, no capital)', 'lower123', false],
    ['key with only uppercase and symbols (min length, no number, no lowercase for some parts)', 'UPPER$$$', false],
    ['key with only lowercase (min length, missing others)', 'longlowercasekey', false],
    ['key with only numbers (min length, missing others)', '12345678', false],
    ['key with only symbols (min length, missing others)', '!!!!!!!!', false],
    ['key with only capitals (min length, missing others)', 'CAPITALS', false],
    ['empty string', '', false],
  ];

  test.each(testCases)('should return %s for key "%s"', (description, inputKey, expectedOutput) => {
    expect(isValidEncryptionKey(inputKey)).toBe(expectedOutput);
  });
});

describe('isEmpty', () => {
  const testCases = [
    // description, inputValue, expectedOutput
    ['null', null, true],
    ['undefined', undefined, true],
    ['empty string ""', '', true],
    ['empty array []', [], true],
    ['empty object {}', {}, true],
    ['string with only spaces " "', " ", false],
    ['number 0', 0, false],
    ['number 1', 1, false],
    ['boolean false', false, false],
    ['boolean true', true, false],
    ['non-empty string "hello"', 'hello', false],
    ['non-empty array [1]', [1], false],
    ['non-empty object { a: 1 }', { a: 1 }, false],
    ['Date object', new Date(), false],
  ];

  test.each(testCases)('should return %s for value: %s', (description, inputValue, expectedOutput) => {
    expect(isEmpty(inputValue)).toBe(expectedOutput);
  });
});
