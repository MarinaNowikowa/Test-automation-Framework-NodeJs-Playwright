const { request } = require('@playwright/test');

class ApiClient {
  constructor(baseURL = 'https://jsonplaceholder.typicode.com') {
    this.baseURL = baseURL;
    this.context = null;
  }

  async init() {
    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async dispose() {
    if (this.context) {
      await this.context.dispose();
    }
  }

  async get(endpoint, options = {}) {
    return await this.context.get(endpoint, options);
  }

  async post(endpoint, data, options = {}) {
    return await this.context.post(endpoint, {
      data: data,
      ...options
    });
  }

  async put(endpoint, data, options = {}) {
    return await this.context.put(endpoint, {
      data: data,
      ...options
    });
  }

  async patch(endpoint, data, options = {}) {
    return await this.context.patch(endpoint, {
      data: data,
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return await this.context.delete(endpoint, options);
  }
}

module.exports = ApiClient;
