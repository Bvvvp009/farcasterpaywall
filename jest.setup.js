// Add any global test setup here
jest.setTimeout(10000); // Increase timeout for async operations

// Mock environment variables if needed
process.env = {
  ...process.env,
  // Add any environment variables your tests need here
}; 