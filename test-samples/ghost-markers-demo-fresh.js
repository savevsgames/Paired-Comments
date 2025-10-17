/**
 * Ghost Markers Test File
 *
 * This file demonstrates Ghost Marker functionality.
 * Add comments to specific lines, then edit the file to see
 * how ghost markers automatically track your changes!
 */

// Test 1: Simple function
function calculateSum(a, b) {
  return a + b;
}

// Test 2: Class with methods
class UserManager {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
  }

  removeUser(userId) {
    this.users = this.users.filter(u => u.id !== userId);
  }
}

// Test 3: Async function
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

// Test 4: Complex logic
function processPayment(order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order has no items');
  }

  const total = order.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  if (total > 1000) {
    return applyDiscount(total, 0.1);
  }

  return total;
}

// Test 5: Event handlers
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('submit-btn');
  button.addEventListener('click', handleSubmit);
});

function handleSubmit(event) {
  event.preventDefault();
  console.log('Form submitted!');
}

// Test 6: Multiple lines for drift testing
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  }
};

// Test 7: Nested structure
function buildHierarchy(items) {
  const root = [];
  const map = new Map();

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach(item => {
    if (item.parentId) {
      const parent = map.get(item.parentId);
      if (parent) {
        parent.children.push(map.get(item.id));
      }
    } else {
      root.push(map.get(item.id));
    }
  });

  return root;
}
