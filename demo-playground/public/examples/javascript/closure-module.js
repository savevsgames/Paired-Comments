// Module Pattern with Closures
// Demonstrates private variables and encapsulation in JavaScript

const ShoppingCart = (function() {
  // Private state - only accessible within this closure
  let items = [];
  let discount = 0;

  // Private helper functions
  function calculateSubtotal() {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function applyDiscount(amount) {
    return amount * (1 - discount);
  }

  // Public API
  return {
    addItem(name, price, quantity = 1) {
      const existingItem = items.find(item => item.name === name);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        items.push({ name, price, quantity });
      }

      console.log(`Added ${quantity}x ${name} to cart`);
    },

    removeItem(name) {
      const index = items.findIndex(item => item.name === name);
      if (index > -1) {
        const removed = items.splice(index, 1)[0];
        console.log(`Removed ${removed.name} from cart`);
        return true;
      }
      return false;
    },

    setDiscount(percentage) {
      if (percentage < 0 || percentage > 100) {
        throw new Error('Discount must be between 0 and 100');
      }
      discount = percentage / 100;
      console.log(`Discount set to ${percentage}%`);
    },

    getTotal() {
      const subtotal = calculateSubtotal();
      return applyDiscount(subtotal);
    },

    getItems() {
      return items.map(item => ({ ...item }));
    },

    clear() {
      const itemCount = items.length;
      items = [];
      discount = 0;
      console.log(`Cleared ${itemCount} items from cart`);
    }
  };
})();

// Usage example
ShoppingCart.addItem('Laptop', 999.99, 1);
ShoppingCart.addItem('Mouse', 29.99, 2);
ShoppingCart.setDiscount(10);

console.log('Cart total:', ShoppingCart.getTotal());
console.log('Cart items:', ShoppingCart.getItems());

// Factory pattern with closures
function createCounter(initialValue = 0) {
  let count = initialValue;

  return {
    increment() {
      return ++count;
    },
    decrement() {
      return --count;
    },
    getValue() {
      return count;
    },
    reset(value = 0) {
      count = value;
      return count;
    }
  };
}

const counter1 = createCounter(10);
const counter2 = createCounter(100);

console.log(counter1.increment()); // 11
console.log(counter2.increment()); // 101
