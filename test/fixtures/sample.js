/**
 * Sample JavaScript File for Testing Paired Comments
 * This file contains various code patterns to test AST tracking and range comments
 */

// Test 1: Top-level function with calculation logic
function calculateDiscount(price, discountPercent) {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid discount percentage');
  }

  const discount = price * (discountPercent / 100);
  return price - discount;
}

// Test 2: Arrow function for formatting
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Test 3: Class with multiple methods
class ShoppingCart {
  constructor() {
    this.items = [];
    this.total = 0;
  }

  // Method to add items
  addItem(item) {
    if (!item.id || !item.price || !item.name) {
      throw new Error('Invalid item');
    }
    this.items.push(item);
    this.updateTotal();
  }

  // Method to remove items
  removeItem(itemId) {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) {
      return false;
    }
    this.items.splice(index, 1);
    this.updateTotal();
    return true;
  }

  // Private helper method
  updateTotal() {
    this.total = this.items.reduce((sum, item) => sum + item.price, 0);
  }

  // Checkout with validation
  checkout() {
    if (this.items.length === 0) {
      throw new Error('Cart is empty');
    }
    return {
      items: this.items,
      total: this.total,
      formattedTotal: formatCurrency(this.total)
    };
  }
}

// Test 4: Nested function with closure
function createPriceCalculator(taxRate) {
  // Inner function that captures taxRate
  function calculatePrice(basePrice) {
    const tax = basePrice * taxRate;
    return basePrice + tax;
  }

  return calculatePrice;
}

// Test 5: Async function for API calls
async function fetchProducts(category) {
  try {
    const response = await fetch(`/api/products?category=${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

// Test 6: Generator function
function* generateOrderIds(prefix = 'ORD') {
  let counter = 1000;
  while (true) {
    yield `${prefix}-${counter++}`;
  }
}

// Test 7: Object with methods (object literal)
const orderProcessor = {
  processOrder(order) {
    this.validateOrder(order);
    this.calculateTotals(order);
    return this.createOrderRecord(order);
  },

  validateOrder(order) {
    if (!order.items || order.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    if (!order.customerId) {
      throw new Error('Order must have a customer ID');
    }
  },

  calculateTotals(order) {
    order.subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    order.tax = order.subtotal * 0.08;
    order.total = order.subtotal + order.tax;
  },

  createOrderRecord(order) {
    return {
      id: Math.random().toString(36).substring(7),
      ...order,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }
};

// Test 8: Complex nested structure
class PaymentProcessor {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.retryCount = 3;
  }

  async processPayment(order) {
    // Nested validation function
    const validatePaymentInfo = (paymentInfo) => {
      if (!paymentInfo.cardNumber) {
        throw new Error('Card number is required');
      }
      if (!paymentInfo.cvv) {
        throw new Error('CVV is required');
      }
      return true;
    };

    validatePaymentInfo(order.paymentInfo);

    // Retry logic with nested async
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const result = await this.chargeCard(order);
        return result;
      } catch (error) {
        if (attempt === this.retryCount) {
          throw error;
        }
        await this.delay(1000 * attempt);
      }
    }
  }

  async chargeCard(order) {
    // Simulated API call
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      amount: order.total
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test 9: Module exports (CommonJS style)
module.exports = {
  calculateDiscount,
  formatCurrency,
  ShoppingCart,
  createPriceCalculator,
  fetchProducts,
  generateOrderIds,
  orderProcessor,
  PaymentProcessor
};
