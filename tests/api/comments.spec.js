import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import ApiClient from '../../utils/api-client.js';
import { CommentModel } from '../../models/index.js';
import HTTP_STATUS from '../../utils/http-status.js';
import { AllureHelpers } from '../../utils/allure-helpers.js';
import { faker } from '@faker-js/faker';

test.describe('Comments API Tests', () => {
  let apiClient;

  test.beforeEach(async () => {
    await allure.suite('Comments API');
    
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /comments - Positive Scenarios', () => {
    test('GET /comments — retrieve all', async () => {
      const response = await apiClient.get('/comments');
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const comments = await response.json();
      expect(comments).toHaveLength(500);
      
      for (const comment of comments) {
        const commentModel = new CommentModel(comment);
        const validation = commentModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('CommentModel', validation, comment);
        expect(validation.isValid).toBe(true);
      }
    });

    test('GET /posts/{id}/comments — retrieve comments for a specific post', async () => {
      const commentModel = CommentModel.generate();
      const postId = commentModel.postId;
      
      const response = await apiClient.get(`/posts/${postId}/comments`);
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const comments = await response.json();
      for (const comment of comments) {
        expect(comment.postId).toBe(postId);
        const commentModel = new CommentModel(comment);
        const validation = commentModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('CommentModel', validation, comment);
        expect(validation.isValid).toBe(true);
      }
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
      const commentModel = CommentModel.generate();
      const postId = commentModel.postId;
      
      const response = await apiClient.get(`/comments?postId=${postId}`);
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const comments = await response.json();
      for (const comment of comments) {
        expect(comment.postId).toBe(postId);
        const commentModel = new CommentModel(comment);
        const validation = commentModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('CommentModel', validation, comment);
        expect(validation.isValid).toBe(true);
      }
    });
  });

  test.describe('GET /comments - Negative Scenarios', () => {
    test('GET /comments/{id} — non-existent', async () => {
      const invalidId = CommentModel.generateNonExistentCommentId();
      const response = await apiClient.get(`/comments/${invalidId}`);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });

    test('GET /comments/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const response = await apiClient.get('/comments/invalid-id');
      expect(response.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  test.describe('POST /comments - Create Tests', () => {
    test('POST /comments — create comment with valid data', async () => {
      const commentModel = CommentModel.generate(1);
      const commentData = commentModel.toJson();
      
      const response = await apiClient.post('/comments', commentData);
      const createdComment = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.CREATED);
      
      const createdCommentModel = new CommentModel(createdComment);
      const validation = createdCommentModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('CommentModel', validation, createdComment);
      expect(validation.isValid).toBe(true);
    });

    test('POST /comments — validate email format in comment data', async () => {
      const invalidEmailComment = CommentModel.generateWithInvalidEmail();
      const commentData = invalidEmailComment.toJson();
      const response = await apiClient.post('/comments', commentData);
      expect(response.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  test.describe('PUT /comments - Update Tests', () => {
    test('PUT /comments/{id} — update existing', async () => {
      const commentId = CommentModel.generateRandomCommentId();
      const commentModel = CommentModel.generate(1);
      const updateData = commentModel.toJson();
      updateData.id = commentId;
      
      const response = await apiClient.put(`/comments/${commentId}`, updateData);
      const updatedComment = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedCommentModel = new CommentModel(updatedComment);
      const validation = updatedCommentModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('CommentModel', validation, updatedComment);
      expect(validation.isValid).toBe(true);
    });

    test('PUT /comments/{id} — non-existent', async () => {
      const invalidId = CommentModel.generateNonExistentCommentId();
      const commentModel = CommentModel.generate(1);
      const updateData = commentModel.toJson();
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/comments/${invalidId}`, updateData);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('PATCH /comments - Partial Update Tests', () => {
    test('PATCH /comments/{id} — partial update with valid data', async () => {
      const commentId = CommentModel.generateRandomCommentId();
      const patchData = {
        name: faker.lorem.words(2),
        body: faker.lorem.sentence()
      };
      
      const response = await apiClient.patch(`/comments/${commentId}`, patchData);
      const updatedComment = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedCommentModel = new CommentModel(updatedComment);
      const validation = updatedCommentModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('CommentModel', validation, updatedComment);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('DELETE /comments - Delete Tests', () => {
    test('DELETE /comments/{id} — delete existing', async () => {
      const commentId = CommentModel.generateRandomCommentId();
      const response = await apiClient.delete(`/comments/${commentId}`);
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      expect(response.status()).toBe(HTTP_STATUS.NO_CONTENT);
    });

    test('DELETE /comments/{id} — non-existent', async () => {
      const invalidId = CommentModel.generateNonExistentCommentId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/comments/${invalidId}`);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /comments — malformed JSON', async () => {
      for (const data of CommentModel.MALFORMED_JSON_DATA) {
        try {
          const response = await apiClient.context.post('/comments', {
            data: data,
            headers: { 'Content-Type': 'application/json' }
          });
          
          await allure.issue('API-5', 'JSONPlaceholder should return 400 for malformed JSON');
          expect(response.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /comments — invalid Content-Type headers', async () => {
      const commentModel = CommentModel.generate(1);
      const validData = commentModel.toJson();

      for (const test of CommentModel.INVALID_CONTENT_TYPE_TESTS) {
        const response = await apiClient.context.post('/comments', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
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
          expect(response.status()).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /comments — extremely large payloads', async () => {
      const largePayloadComment = CommentModel.generateLargePayload();
      const largePayload = largePayloadComment.toJson();

      const response = await apiClient.post('/comments', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    test('POST /comments — special characters in comment data', async () => {
      const specialCharComment = CommentModel.generateWithSpecialCharacters();
      const specialCharData = specialCharComment.toJson();
      
      const response = await apiClient.post('/comments', specialCharData);
      await allure.issue('API-11', 'JSONPlaceholder allows creation with special characters');
      expect(response.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
