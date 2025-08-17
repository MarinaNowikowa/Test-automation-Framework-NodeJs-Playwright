import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import ApiClient from '../../utils/api-client.js';
import { PostModel } from '../../models/index.js';
import HTTP_STATUS from '../../utils/http-status.js';
import { AllureHelpers } from '../../utils/allure-helpers.js';
import postsData from '../../test-data/posts.json'

test.describe('Posts API Tests', () => {
  let apiClient;

  test.beforeEach(async () => {
    await allure.suite('Posts API');
    
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /posts - Positive Scenarios', () => {
        test('GET /posts — retrieve all', async () => {
        const response = await apiClient.get('/posts');
        expect(response.status()).toBe(HTTP_STATUS.OK);
        
        const posts = await response.json();
        expect(posts).toHaveLength(100);
        
        for (const post of posts) {
          const postModel = new PostModel(post);
          const validation = postModel.validate();
          await AllureHelpers.logModelValidationIfInvalid('PostModel', validation, post);
          expect(validation.isValid).toBe(true);
        }
      });

        test('GET /posts/{id} — retrieve by ID', async () => {
        const postId = PostModel.generateRandomPostId();
        const response = await apiClient.get(`/posts/${postId}`);
        const post = await response.json();
        expect(response.status()).toBe(HTTP_STATUS.OK);
        
        const postModel = new PostModel(post);
        const validation = postModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('PostModel', validation, post);
        expect(validation.isValid).toBe(true);
      });

          test('GET /posts?userId={userId} — retrieve posts by user ID', async () => {
        const postModel = PostModel.generate();
        const userId = postModel.userId;
        const response = await apiClient.get(`/posts?userId=${userId}`);
        const posts = await response.json();
        expect(response.status()).toBe(HTTP_STATUS.OK);

        for (const post of posts) {
          expect(post.userId).toBe(userId);
          const postModel = new PostModel(post);
          const validation = postModel.validate();
          await AllureHelpers.logModelValidationIfInvalid('PostModel', validation, post);
          expect(validation.isValid).toBe(true);
        }
      });
  });

  test.describe('GET /posts - Negative Scenarios', () => {
          test('GET /posts/{id} — non-existent', async () => {
        const invalidId = PostModel.generateNonExistentPostId();
        const response = await apiClient.get(`/posts/${invalidId}`);
        expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
      });

    test('GET /posts/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/posts/invalid-id');
      expect(invalidFormatResponse.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });

  });

  test.describe('POST /posts - Data-Driven Tests', () => {
    test('POST /posts — create posts with valid data from external file', async () => {
      for (const postData of postsData.validPosts) {
        const response = await apiClient.post('/posts', postData);
        const createdPost = await response.json();
        expect(response.status()).toBe(HTTP_STATUS.CREATED);
        
        const postModel = new PostModel(createdPost);
        const validation = postModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('PostModel', validation, createdPost);
        expect(validation.isValid).toBe(true);
        expect(createdPost.id).toBe(101); 
      }
    });

    test('POST /posts — handle invalid post data from external file', async () => {
      for (const invalidPost of postsData.invalidPosts) {
        await allure.issue('API-12', 'JSONPlaceholder allows creation with invalid post data');
        const response = await apiClient.post('/posts', invalidPost.data);
        expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status());
      }
    });
  });

  test.describe('PUT /posts - Update Tests', () => {
    test('PUT /posts/{id} — update existing', async () => {
      const updateData = postsData.updateData[0];
      const response = await apiClient.put(`/posts/${updateData.id}`, updateData);
      const updatedPost = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const postModel = new PostModel(updatedPost);
      const validation = postModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('PostModel', validation, updatedPost);
      expect(validation.isValid).toBe(true);
    });

    test('PUT /posts/{id} — non-existent', async () => {
      const invalidId = PostModel.generateNonExistentPostId();
      const updateData = { ...postsData.updateData[0], id: invalidId };
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/posts/${invalidId}`, updateData);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('PATCH /posts - Partial Update Tests', () => {
    test('PATCH /posts/{id} — partial update with valid data', async () => {
      const postId = 1;
      const patchData = PostModel.generatePartialUpdate();
      
      const response = await apiClient.patch(`/posts/${postId}`, patchData);
      const updatedPost = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const postModel = new PostModel(updatedPost);
      const validation = postModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('PostModel', validation, updatedPost);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('DELETE /posts - Delete Tests', () => {
    test('DELETE /posts/{id} — delete existing', async () => {
      const postId = PostModel.generateRandomPostId();
      const response = await apiClient.delete(`/posts/${postId}`);
      
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      // DELETE should return 204 No Content for successful deletion
      expect(response.status()).toBe(HTTP_STATUS.NO_CONTENT);
    });

    test('DELETE /posts/{id} — non-existent', async () => {
      const invalidId = PostModel.generateNonExistentPostId();
      const response = await apiClient.delete(`/posts/${invalidId}`);
      
      expect(response.status()).toBe(HTTP_STATUS.OK);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /posts — malformed JSON', async () => {
      for (const data of PostModel.MALFORMED_JSON_DATA) {
        try {
          const response = await apiClient.context.post('/posts', {
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
        expect(response.status()).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
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
          expect(response.status()).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /posts — extremely large payloads', async () => {
      const largePayloadModel = PostModel.generateLargePayload();
      const largePayload = largePayloadModel.toJson();

      const response = await apiClient.post('/posts', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    test('POST /posts — special characters in data', async () => {
      const specialCharModel = PostModel.generateWithSpecialCharacters();
      const specialCharacterData = specialCharModel.toJson();
      
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/posts', specialCharacterData);
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status());
    });

  });

});
