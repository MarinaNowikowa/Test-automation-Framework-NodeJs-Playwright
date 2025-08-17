import { request } from '@playwright/test';
import { AllureHelpers } from './allure-helpers.js';

class ApiClient {
  constructor(baseURL = 'https://jsonplaceholder.typicode.com', customHeaders = {}) {
    this.baseURL = baseURL;
    this.customHeaders = customHeaders;
    this.context = null;
  }

  static get DEFAULT_HEADERS() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  static mergeHeaders(customHeaders = {}) {
    return { ...ApiClient.DEFAULT_HEADERS, ...customHeaders };
  }

  getHeaders() {
    return ApiClient.mergeHeaders(this.customHeaders);
  }

  async init() {
    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: this.getHeaders()
    });
  }

  async dispose() {
    if (this.context) {
      await this.context.dispose();
    }
  }

  async get(endpoint, options = {}) {
    const response = await this.context.get(endpoint, options);
    await this._logRequestResponse('GET', endpoint, options.headers, null, response);
    return response;
  }

  async post(endpoint, data, options = {}) {
    const response = await this.context.post(endpoint, {
      data: data,
      ...options
    });
    await this._logRequestResponse('POST', endpoint, options.headers, data, response);
    return response;
  }

  async put(endpoint, data, options = {}) {
    const response = await this.context.put(endpoint, {
      data: data,
      ...options
    });
    await this._logRequestResponse('PUT', endpoint, options.headers, data, response);
    return response;
  }

  async patch(endpoint, data, options = {}) {
    const response = await this.context.patch(endpoint, {
      data: data,
      ...options
    });
    await this._logRequestResponse('PATCH', endpoint, options.headers, data, response);
    return response;
  }

  async delete(endpoint, options = {}) {
    const response = await this.context.delete(endpoint, options);
    await this._logRequestResponse('DELETE', endpoint, options.headers, null, response);
    return response;
  }

  async _logRequestResponse(method, endpoint, requestHeaders, requestBody, response) {
    try {
      const fullUrl = `${this.baseURL}${endpoint}`;
      const responseHeaders = response.headers();
      let responseBody = null;

      const allRequestHeaders = ApiClient.mergeHeaders({ ...this.customHeaders, ...requestHeaders });

      try {
        const contentType = responseHeaders['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseBody = await response.json();
        } else if (contentType.includes('text/')) {
          responseBody = await response.text();
        }
      } catch (error) {
        responseBody = null;
      }

      await AllureHelpers.logRequestResponse(
        method,
        fullUrl,
        allRequestHeaders,
        requestBody,
        response.status(),
        responseHeaders,
        responseBody
      );
    } catch (error) {
      console.warn('Failed to log request/response to Allure:', error.message);
    }
  }
}

export default ApiClient;
