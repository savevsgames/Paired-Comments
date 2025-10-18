/**
 * AST Anchor Testing File
 *
 * This file tests AST-based ghost marker tracking (v2.0.5)
 * Test scenarios:
 * 1. Function moves (up/down in file)
 * 2. Function renames
 * 3. Class method moves
 * 4. Nested symbols
 */

// Test 1: Top-level function (will add comment here and move it)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Test 2: Another top-level function
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

// Test 3: Class with methods
class ShoppingCart {
  constructor() {
    this.items = [];
    this.total = 0;
  }

  // Test 4: Method that we'll move within the class
  addItem(item) {
    this.items.push(item);
    this.updateTotal();
  }

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.updateTotal();
  }

  updateTotal() {
    this.total = calculateTotal(this.items);
  }

  checkout() {
    console.log(`Total: ${formatCurrency(this.total)}`);
    return this.total;
  }
}

// Test 5: Nested function
function createDiscount(percentage) {
  // Inner function that we'll add a comment to
  function applyDiscount(price) {
    return price * (1 - percentage / 100);
  }

  return applyDiscount;
}

// Test 6: Arrow function
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Test 7: Object with methods
const orderProcessor = {
  processOrder(order) {
    if (!order.items || order.items.length === 0) {
      throw new Error('Order is empty');
    }
    return true;
  },

  cancelOrder(orderId) {
    console.log(`Cancelling order ${orderId}`);
    return true;
  }
};

// Test 8: Async function
async function fetchProducts() {
  const response = await fetch('/api/products');
  return response.json();
}

// Test 9: Generator function
function* generateOrderIds() {
  let id = 1000;
  while (true) {
    yield `ORD-${id++}`;
  }
}

// Test 10: Complex nested structure
class UserManager {
  constructor() {
    this.users = new Map();
  }

  addUser(user) {
    // Nested validation function
    const validate = (userData) => {
      if (!userData.email) {
        throw new Error('Email required');
      }
      return true;
    };

    validate(user);
    this.users.set(user.id, user);
  }

  getUser(userId) {
    return this.users.get(userId);
  }
}

// End of file - space for moving functions around
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}