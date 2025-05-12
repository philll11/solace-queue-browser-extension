// jest.config.js
module.exports = {
    // Use jsdom to simulate DOM environment for UI scripts
    testEnvironment: 'jest-environment-jsdom',
  
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
  
    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',
  
    // A list of paths to modules that run some code to configure or set up the testing framework before each test file
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Points to our setup file (created next)
  
    // Optional: More verbose output
    verbose: true,
  
    // Define module file extensions Jest should recognize
    moduleFileExtensions: ['js', 'json'],
  
    // Define transform to use Babel for JS files
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
  
    // Ignore transformations for node_modules except potentially specific ones if needed later
    transformIgnorePatterns: ['/node_modules/'],
  };