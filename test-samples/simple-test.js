/**
 * Simple Test File for Manual Testing
 * Clean file - add comments using Ctrl+Alt+P > Ctrl+Alt+A
 */

// Function 1
function add(a, b) {
  return a + b;
}

// Function 2
function multiply(a, b) {
  return a * b;
}

// Function 3
function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

module.exports = { add, multiply, divide };
