// Async/Await Patterns and Promise Handling
// Demonstrates modern JavaScript async patterns

class DataFetcher {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.cache = new Map();
  }

  async fetchWithRetry(endpoint, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.apiUrl}/${endpoint}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`Failed after ${maxRetries} attempts:`, error);
          throw error;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await this.sleep(delay);
      }
    }
  }

  async fetchParallel(endpoints) {
    const promises = endpoints.map(endpoint =>
      this.fetchWithCache(endpoint)
    );

    return Promise.all(promises);
  }

  async fetchWithCache(endpoint) {
    if (this.cache.has(endpoint)) {
      return this.cache.get(endpoint);
    }

    const data = await this.fetchWithRetry(endpoint);
    this.cache.set(endpoint, data);
    return data;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DataFetcher;
