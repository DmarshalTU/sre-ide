// Test patterns for security scanning
// This file contains test cases for the SecurityScanner

const testCases = [
  "My password is [TEST_PASSWORD]",
  "password: [TEST_PASSWORD]",
  "password=[TEST_PASSWORD]",
  "The password is [TEST_PASSWORD]",
  "pwd: [TEST_PASSWORD]",
  "pass=[TEST_PASSWORD]",
  "my password: [TEST_PASSWORD]"
];

// Test password patterns
const patterns = [
  /\b(password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{8,})['"]?/gi,
  /\b(?:my |the )?password\s+(?:is|are|:|=)\s*['"]?([^\s'"]{4,})['"]?/gi,
  /\b(?:pass|pwd)\s*[:=]\s*['"]?([^\s'"]{4,})['"]?/gi,
];

console.log("Testing password detection patterns:\n");

testCases.forEach(testCase => {
  console.log(`Testing: "${testCase}"`);
  let matched = false;
  
  patterns.forEach((pattern, index) => {
    const match = testCase.match(pattern);
    if (match) {
      console.log(`  ✓ Matched by pattern ${index + 1}: ${match[0]}`);
      matched = true;
    }
  });
  
  if (!matched) {
    console.log(`  ✗ No match found`);
  }
  console.log("");
});

// Run the test
console.log("Run this in browser console or Node.js to test");
console.log("Note: This is a test file for development purposes only");