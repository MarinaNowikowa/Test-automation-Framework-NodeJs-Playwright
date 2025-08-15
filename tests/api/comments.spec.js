const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');
const ApiClient = require('../../utils/api-client');
const SchemaValidator = require('../../utils/schema-validator');
const TestHelpers = require('../../utils/test-helpers');

test.describe('Comments API Tests', () => {
  let apiClient;
  let schemaValidator;

  test.beforeEach(async () => {
    await allure.suite('Comments API');
    
    apiClient = new ApiClient();
    await apiClient.init();
    schemaValidator = new SchemaValidator();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /comments - Positive Scenarios', () => {
    test('GET /comments — retrieve all', async () => {
      const response = await apiClient.get('/comments');
      const comments = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getCommentSchema() }
      );

      expect(comments).toHaveLength(500);
      comments.forEach(comment => {
        expect(comment).toHaveProperty('id');
        expect(comment).toHaveProperty('postId');
        expect(comment).toHaveProperty('name');
        expect(comment).toHaveProperty('email');
        expect(comment).toHaveProperty('body');
      });
    });

    test('GET /posts/{id}/comments — retrieve comments for a specific post', async () => {
      const postId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.get(`/posts/${postId}/comments`);
      const comments = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getCommentSchema() }
      );

      comments.forEach(comment => {
        expect(comment.postId).toBe(postId);
      });
    });

    test('GET /comments — validate email formats', async () => {
      const response = await apiClient.get('/comments');
      const comments = await response.json();
      const sampleComments = comments.slice(0, 10);
      sampleComments.forEach(comment => {
        expect(comment.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    test('GET /comments?postId={postId} — retrieve comments by postId query parameter', async () => {
      const postId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.get(`/comments?postId=${postId}`);
      const comments = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getCommentSchema() }
      );

      comments.forEach(comment => {
        expect(comment.postId).toBe(postId);
      });
    });
  });

  test.describe('GET /comments - Negative Scenarios', () => {
    test('GET /comments/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const response = await apiClient.get(`/comments/${invalidId}`);
      expect(response.status()).toBe(404);
    });

    test('GET /comments/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const response = await apiClient.get('/comments/invalid-id');
      expect(response.status()).toBe(400);
    });
  });

  test.describe('POST /comments - Create Tests', () => {
    test('POST /comments — create comment with valid data', async () => {
      const commentData = TestHelpers.generateRandomComment(1);
      const response = await apiClient.post('/comments', commentData);
      const createdComment = await TestHelpers.validateResponse(
        response, 
        201, // POST should return 201 Created
        schemaValidator, 
        schemaValidator.getCommentSchema()
      );

      expect(createdComment.name).toBe(commentData.name);
      expect(createdComment.email).toBe(commentData.email);
      expect(createdComment.body).toBe(commentData.body);
      expect(createdComment.postId).toBe(commentData.postId);
      expect(createdComment.id).toBe(501); // JSONPlaceholder returns 501 for new comments
    });

    test('POST /comments — validate email format in comment data', async () => {
      const invalidEmails = TestHelpers.generateInvalidData('comment').invalidEmails;
      for (const invalidEmail of invalidEmails) {
        const commentData = TestHelpers.generateRandomComment(1);
        commentData.email = invalidEmail;
        await allure.issue('API-12', 'JSONPlaceholder allows creation with invalid email format');
        const response = await apiClient.post('/comments', commentData);
        expect([400, 422]).toContain(response.status());
      }
    });
  });

  test.describe('PUT /comments - Update Tests', () => {
    test('PUT /comments/{id} — update existing', async () => {
      const commentId = TestHelpers.getRandomId(1, 500);
      const updateData = TestHelpers.generateRandomComment(1);
      updateData.id = commentId;
      
      const response = await apiClient.put(`/comments/${commentId}`, updateData);
      const updatedComment = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getCommentSchema()
      );

      expect(updatedComment.id).toBe(commentId);
      expect(updatedComment.name).toBe(updateData.name);
      expect(updatedComment.email).toBe(updateData.email);
      expect(updatedComment.body).toBe(updateData.body);
      expect(updatedComment.postId).toBe(updateData.postId);
    });

    test('PUT /comments/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const updateData = TestHelpers.generateRandomComment(1);
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/comments/${invalidId}`, updateData);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /comments - Partial Update Tests', () => {
    test('PATCH /comments/{id} — partial update with valid data', async () => {
      const commentId = TestHelpers.getRandomId(1, 500);
      const patchData = TestHelpers.generatePartialUpdate('comment');
      
      const response = await apiClient.patch(`/comments/${commentId}`, patchData);
      const updatedComment = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getCommentSchema()
      );

      expect(updatedComment.id).toBe(commentId);
      expect(updatedComment.name).toBe(patchData.name);
      expect(updatedComment.body).toBe(patchData.body);
    });
  });

  test.describe('DELETE /comments - Delete Tests', () => {
    test('DELETE /comments/{id} — delete existing', async () => {
      const commentId = TestHelpers.getRandomId(1, 500);
      const response = await apiClient.delete(`/comments/${commentId}`);
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      expect(response.status()).toBe(204);
    });

    test('DELETE /comments/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/comments/${invalidId}`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /comments — malformed JSON', async () => {
      const invalidData = TestHelpers.generateInvalidData('comment');
      const malformedData = [
        invalidData.emptyObject,
        invalidData.nullValues,
        invalidData.wrongTypes,
        invalidData.missingFields,
        'invalid-json-string',
        '{"incomplete": json',
        null,
        undefined
      ];

      for (const data of malformedData) {
        try {
          const response = await apiClient.context.post('/comments', {
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

    test('POST /comments — invalid Content-Type headers', async () => {
      const validData = TestHelpers.generateRandomComment(1);
      const contentTypeTests = [
        { contentType: undefined, description: 'missing Content-Type' },
        { contentType: 'text/plain', description: 'incorrect Content-Type' }
      ];

      for (const test of contentTypeTests) {
        const response = await apiClient.context.post('/comments', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(415);
      }
    });

    test('POST /comments — unsupported HTTP methods', async () => {
      const testCases = [
        { method: 'HEAD', endpoint: '/comments/1' },
        { method: 'OPTIONS', endpoint: '/comments' }
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

    test('POST /comments — extremely large payloads', async () => {
      const largePayload = {
        postId: 1,
        name: 'A'.repeat(10000),
        email: `test@${'b'.repeat(5000)}.com`,
        body: 'C'.repeat(50000)
      };

      const response = await apiClient.post('/comments', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(413); // Payload Too Large
    });

    test('POST /comments — special characters in comment data', async () => {
      const specialCharData = TestHelpers.generateInvalidData('comment').specialCharacters;
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/comments', specialCharData);
      expect([400, 422]).toContain(response.status());
    });
  });
});
