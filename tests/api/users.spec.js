import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import ApiClient from '../../utils/api-client.js';
import { UserModel } from '../../models/index.js';
import HTTP_STATUS from '../../utils/http-status.js';
import { AllureHelpers } from '../../utils/allure-helpers.js';
import usersData from '../../test-data/users.json'

test.describe('Users API Tests', () => {
  let apiClient;

  test.beforeEach(async () => {
    await allure.suite('Users API');
    
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /users - Positive Scenarios', () => {
        test('GET /users — retrieve all', async () => {
        const response = await apiClient.get('/users');
        expect(response.status()).toBe(HTTP_STATUS.OK);
        
        const users = await response.json();
        expect(users).toHaveLength(10);
        
        for (const user of users) {
          const userModel = new UserModel(user);
          const validation = userModel.validate();
          await AllureHelpers.logModelValidationIfInvalid('UserModel', validation, user);
          expect(validation.isValid).toBe(true);
        }
      });

        test('GET /users/{id} — retrieve by ID', async () => {
        const userId = UserModel.generateRandomUserId();
        const response = await apiClient.get(`/users/${userId}`);
        const user = await response.json();
        expect(response.status()).toBe(HTTP_STATUS.OK);
        
        const userModel = new UserModel(user);
        const validation = userModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('UserModel', validation, user);
        expect(validation.isValid).toBe(true);

        expect(user.id).toBe(userId);
      });

        test('GET /users?username={username} — retrieve by username', async () => {
        // First get all users to get a valid username
        const allUsersResponse = await apiClient.get('/users');
        const allUsers = await allUsersResponse.json();
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        
        const response = await apiClient.get(`/users?username=${randomUser.username}`);
        const users = await response.json();
        expect(response.status()).toBe(HTTP_STATUS.OK);

        expect(users).toHaveLength(1);
        expect(users[0].username).toBe(randomUser.username);
        
        for (const user of users) {
          const userModel = new UserModel(user);
          const validation = userModel.validate();
          await AllureHelpers.logModelValidationIfInvalid('UserModel', validation, user);
          expect(validation.isValid).toBe(true);
        }
      });
  });

  test.describe('GET /users - Negative Scenarios', () => {
          test('GET /users/{id} — non-existent', async () => {
        const invalidId = UserModel.generateNonExistentUserId();
        const response = await apiClient.get(`/users/${invalidId}`);
        expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
      });

    test('GET /users/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/users/invalid-id');
      expect(invalidFormatResponse.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  test.describe('POST /users - Data-Driven Tests', () => {
    test('POST /users — create users with valid data from external file', async () => {
      for (const userData of usersData.validUsers) {
        const response = await apiClient.post('/users', userData);
        const createdUser = await response.json();
        expect(response.status()).toBe(HTTP_STATUS.CREATED);
        
        const userModel = new UserModel(createdUser);
        const validation = userModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('UserModel', validation, createdUser);
        expect(validation.isValid).toBe(true);
        expect(createdUser.id).toBe(11); 
      }
    });

    test('POST /users — handle invalid user data from external file', async () => {
      for (const invalidUser of usersData.invalidUsers) {
        await allure.issue('API-12', 'JSONPlaceholder allows creation with invalid user data');
        const response = await apiClient.post('/users', invalidUser.data);
        expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status());
      }
    });
  });

  test.describe('PUT /users - Update Tests', () => {
    test('PUT /users/{id} — update existing', async () => {
      const userId = UserModel.generateRandomUserId();
      const updateData = usersData.validUsers[0];
      updateData.id = userId;
      
      const response = await apiClient.put(`/users/${userId}`, updateData);
      const updatedUser = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const userModel = new UserModel(updatedUser);
      const validation = userModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('UserModel', validation, updatedUser);
      expect(validation.isValid).toBe(true);
    });

    test('PUT /users/{id} — non-existent', async () => {
      const invalidId = UserModel.generateNonExistentUserId();
      const updateData = usersData.validUsers[0];
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/users/${invalidId}`, updateData);
      // PUT should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('PATCH /users - Partial Update Tests', () => {
    test('PATCH /users/{id} — partial update with valid data', async () => {
      const userId = UserModel.generateRandomUserId();
      const patchData = UserModel.generatePartialUpdate();
      const response = await apiClient.patch(`/users/${userId}`, patchData);
      expect(response.status()).toBe(HTTP_STATUS.OK);
      const updatedUser = await response.json();
      
      const userModel = new UserModel(updatedUser);
      const validation = userModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('UserModel', validation, updatedUser);
      expect(validation.isValid).toBe(true);
    });
  });
  
  test.describe('DELETE /users - Delete Tests', () => {
    test('DELETE /users/{id} — delete existing', async () => {
      const userId = UserModel.generateRandomUserId();
      const response = await apiClient.delete(`/users/${userId}`);
      
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      // DELETE should return 204 No Content for successful deletion
      expect(response.status()).toBe(HTTP_STATUS.NO_CONTENT);
    });

    test('DELETE /users/{id} — non-existent', async () => {
      const invalidId = UserModel.generateNonExistentUserId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/users/${invalidId}`);
      // DELETE should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('Nested Resource Tests', () => {
    test('GET /users/{id}/posts — retrieve posts for user', async () => {
      const userId = UserModel.generateRandomUserId();
      const response = await apiClient.get(`/users/${userId}/posts`);
      const posts = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);

      posts.forEach(post => {
        expect(post.userId).toBe(userId);
      });
    });

    test('GET /users/{id}/albums — retrieve albums for user', async () => {
      const userId = UserModel.generateRandomUserId();
      const response = await apiClient.get(`/users/${userId}/albums`);
      const albums = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);

      albums.forEach(album => {
        expect(album.userId).toBe(userId);
      });
    });

    test('GET /users/{id}/todos — retrieve todos for user', async () => {
      const userId = UserModel.generateRandomUserId();
      const response = await apiClient.get(`/users/${userId}/todos`);
      const todos = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);

      todos.forEach(todo => {
        expect(todo.userId).toBe(userId);
      });
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /users — malformed JSON', async () => {
      for (const data of UserModel.MALFORMED_JSON_DATA) {
        try {
          const response = await apiClient.context.post('/users', {
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

    test('POST /users — invalid Content-Type headers', async () => {
      const userModel = UserModel.generate();
      const validData = userModel.toJson();
      const contentTypeTests = [
        { contentType: undefined, description: 'missing Content-Type' },
        { contentType: 'text/plain', description: 'incorrect Content-Type' }
      ];

      for (const test of contentTypeTests) {
        const response = await apiClient.context.post('/users', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
      }
    });

    test('POST /users — unsupported HTTP methods', async () => {
      const testCases = [
        { method: 'HEAD', endpoint: '/users/1' },
        { method: 'OPTIONS', endpoint: '/users' }
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

    test('POST /users — extremely large payloads', async () => {
      const largePayloadModel = UserModel.generateLargePayload();
      const largePayload = largePayloadModel.toJson();

      const response = await apiClient.post('/users', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE); 
    });

    test('POST /users — special characters in data', async () => {
      const specialCharModel = UserModel.generateWithSpecialCharacters();
      const specialCharacterData = specialCharModel.toJson();
      
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/users', specialCharacterData);
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status());
    });
  });
});
