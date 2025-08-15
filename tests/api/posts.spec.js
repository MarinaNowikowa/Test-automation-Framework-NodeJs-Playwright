const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');
const ApiClient = require('../../utils/api-client');
const SchemaValidator = require('../../utils/schema-validator');
const TestHelpers = require('../../utils/test-helpers');
const postsData = require('../../test-data/posts.json');

test.describe('Posts API Tests', () => {
  let apiClient;
  let schemaValidator;

  test.beforeEach(async () => {
    await allure.suite('Posts API');
    
    apiClient = new ApiClient();
    await apiClient.init();
    schemaValidator = new SchemaValidator();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /posts - Positive Scenarios', () => {
    test('GET /posts — retrieve all', async () => {
      const response = await apiClient.get('/posts');
      const posts = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getPostSchema() }
      );

      expect(posts).toHaveLength(100);
      expect(posts[0]).toHaveProperty('id');
      expect(posts[0]).toHaveProperty('userId');
      expect(posts[0]).toHaveProperty('title');
      expect(posts[0]).toHaveProperty('body');
    });

    test('GET /posts/{id} — retrieve by ID', async () => {
      const postId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.get(`/posts/${postId}`);
      const post = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getPostSchema()
      );

      expect(post.id).toBe(postId);
      expect(post.userId).toBeGreaterThan(0);
      expect(post.title).toBeTruthy();
      expect(post.body).toBeTruthy();
    });

    test('GET /posts?userId={userId} — retrieve posts by user ID', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const response = await apiClient.get(`/posts?userId=${userId}`);
      const posts = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getPostSchema() }
      );

      posts.forEach(post => {
        expect(post.userId).toBe(userId);
      });
    });
  });

  test.describe('GET /posts - Negative Scenarios', () => {
    test('GET /posts/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const response = await apiClient.get(`/posts/${invalidId}`);
      expect(response.status()).toBe(404);
    });

    test('GET /posts/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/posts/invalid-id');
      expect(invalidFormatResponse.status()).toBe(400);
    });

  });

  test.describe('POST /posts - Data-Driven Tests', () => {
    test('POST /posts — create posts with valid data from external file', async () => {
      for (const postData of postsData.validPosts) {
        const response = await apiClient.post('/posts', postData);
        const createdPost = await TestHelpers.validateResponse(
          response, 
          201, // POST should return 201 Created
          schemaValidator, 
          schemaValidator.getPostSchema()
        );

        expect(createdPost.title).toBe(postData.title);
        expect(createdPost.body).toBe(postData.body);
        expect(createdPost.userId).toBe(postData.userId);
        expect(createdPost.id).toBe(101); 
      }
    });

    test('POST /posts — handle invalid post data from external file', async () => {
      for (const invalidPost of postsData.invalidPosts) {
        await allure.issue('API-13', 'JSONPlaceholder allows creation with invalid post data');
        const response = await apiClient.post('/posts', invalidPost.data);
        expect([400, 422]).toContain(response.status());
      }
    });
  });

  test.describe('PUT /posts - Update Tests', () => {
    test('PUT /posts/{id} — update existing', async () => {
      const updateData = postsData.updateData[0];
      const response = await apiClient.put(`/posts/${updateData.id}`, updateData);
      const updatedPost = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getPostSchema()
      );

      expect(updatedPost.id).toBe(updateData.id);
      expect(updatedPost.title).toBe(updateData.title);
      expect(updatedPost.body).toBe(updateData.body);
      expect(updatedPost.userId).toBe(updateData.userId);
    });

    test('PUT /posts/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const updateData = { ...postsData.updateData[0], id: invalidId };
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/posts/${invalidId}`, updateData);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /posts - Partial Update Tests', () => {
    test('PATCH /posts/{id} — partial update with valid data', async () => {
      const postId = 1;
      const patchData = { title: 'Partially Updated Title' };
      
      const response = await apiClient.patch(`/posts/${postId}`, patchData);
      const updatedPost = await TestHelpers.validateResponse(response, 200);

      expect(updatedPost.id).toBe(postId);
      expect(updatedPost.title).toBe(patchData.title);
    });
  });

  test.describe('DELETE /posts - Delete Tests', () => {
    test('DELETE /posts/{id} — delete existing', async () => {
      const postId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.delete(`/posts/${postId}`);
      
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      // DELETE should return 204 No Content for successful deletion
      expect(response.status()).toBe(204);
    });

    test('DELETE /posts/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const response = await apiClient.delete(`/posts/${invalidId}`);
      
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /posts — malformed JSON', async () => {
      const malformedData = [
        'invalid-json-string',
        '{"incomplete": json',
        null,
        undefined
      ];

      for (const data of malformedData) {
        try {
          const response = await apiClient.context.post('/posts', {
            data: data,
            headers: { 'Content-Type': 'application/json' }
          });
          
          await allure.issue('API-5', 'JSONPlaceholder should return 400 for malformed JSON');
          expect(response.status()).toBe(400);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /posts — invalid Content-Type headers', async () => {
      const validData = { title: 'Test', body: 'Test body', userId: 1 };
      const contentTypeTests = [
        { contentType: undefined, description: 'missing Content-Type' },
        { contentType: 'text/plain', description: 'incorrect Content-Type' }
      ];

      for (const test of contentTypeTests) {
        const response = await apiClient.context.post('/posts', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(415);
      }
    });

    test('POST /posts — unsupported HTTP methods', async () => {
      const testCases = [
        { method: 'HEAD', endpoint: '/posts/1' },
        { method: 'OPTIONS', endpoint: '/posts' }
      ];

      for (const testCase of testCases) {
        try {
          const response = await apiClient.context.fetch(`${apiClient.baseURL}${testCase.endpoint}`, {
            method: testCase.method
          });
          
          await allure.issue('API-6', 'JSONPlaceholder should return 405 for unsupported methods');
          expect(response.status()).toBe(405);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /posts — extremely large payloads', async () => {
      const largePayload = {
        title: 'A'.repeat(10000),
        body: 'B'.repeat(50000),
        userId: 1
      };

      const response = await apiClient.post('/posts', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(413); // Payload Too Large
    });

    test('POST /posts — special characters in data', async () => {
      const specialCharacterData = {
        title: '🚀 Test with émojis & spëcial çhars',
        body: 'Body with special chars: <script>alert("test")</script> & symbols: ©®™',
        userId: 1
      };
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/posts', specialCharacterData);
      expect([400, 422]).toContain(response.status());
    });

  });

});
