// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill structuredClone for Node < 17
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

// Mock IndexedDB for tests
const fakeIndexedDB = require('fake-indexeddb');
const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

global.indexedDB = new FDBFactory();
global.IDBKeyRange = FDBKeyRange;
global.IDBRequest = fakeIndexedDB.IDBRequest;
global.IDBOpenDBRequest = fakeIndexedDB.IDBOpenDBRequest;
global.IDBDatabase = fakeIndexedDB.IDBDatabase;
global.IDBObjectStore = fakeIndexedDB.IDBObjectStore;
global.IDBIndex = fakeIndexedDB.IDBIndex;
global.IDBCursor = fakeIndexedDB.IDBCursor;
global.IDBCursorWithValue = fakeIndexedDB.IDBCursorWithValue;
global.IDBTransaction = fakeIndexedDB.IDBTransaction;

// Mock window.matchMedia (used by some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
