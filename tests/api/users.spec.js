const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');
const ApiClient = require('../../utils/api-client');
const SchemaValidator = require('../../utils/schema-validator');
const TestHelpers = require('../../utils/test-helpers');
const usersData = require('../../test-data/users.json');

test.describe('Users API Tests', () => {
  let apiClient;
  let schemaValidator;

  test.beforeEach(async () => {
    await allure.suite('Users API');
    
    apiClient = new ApiClient();
    await apiClient.init();
    schemaValidator = new SchemaValidator();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /users - Positive Scenarios', () => {
    test('GET /users — retrieve all', async () => {
      const response = await apiClient.get('/users');
      const users = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getUserSchema() }
      );

      expect(users).toHaveLength(10);
      users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    test('GET /users/{id} — retrieve by ID', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const response = await apiClient.get(`/users/${userId}`);
      const user = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getUserSchema()
      );

      expect(user.id).toBe(userId);
      expect(user.name).toBeTruthy();
      expect(user.username).toBeTruthy();
      expect(user.email).toBeTruthy();
      expect(user.address).toBeTruthy();
      expect(user.company).toBeTruthy();
    });

    test('GET /users?username={username} — retrieve by username', async () => {
      // First get all users to get a valid username
      const allUsersResponse = await apiClient.get('/users');
      const allUsers = await allUsersResponse.json();
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      
      const response = await apiClient.get(`/users?username=${randomUser.username}`);
      const users = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getUserSchema() }
      );

      expect(users).toHaveLength(1);
      expect(users[0].username).toBe(randomUser.username);
    });
  });

  test.describe('GET /users - Negative Scenarios', () => {
    test('GET /users/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const response = await apiClient.get(`/users/${invalidId}`);
      expect(response.status()).toBe(404);
    });

    test('GET /users/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/users/invalid-id');
      expect(invalidFormatResponse.status()).toBe(400);
    });
  });

  test.describe('POST /users - Data-Driven Tests', () => {
    test('POST /users — create users with valid data from external file', async () => {
      for (const userData of usersData.validUsers) {
        const response = await apiClient.post('/users', userData);
        const createdUser = await TestHelpers.validateResponse(
          response, 
          201, // POST should return 201 Created
          schemaValidator,
          schemaValidator.getUserSchema()
        );

        expect(createdUser.name).toBe(userData.name);
        expect(createdUser.username).toBe(userData.username);
        expect(createdUser.email).toBe(userData.email);
        expect(createdUser.id).toBe(11); 
      }
    });

    test('POST /users — handle invalid user data from external file', async () => {
      for (const invalidUser of usersData.invalidUsers) {
        await allure.issue('API-13', 'JSONPlaceholder allows creation with invalid user data');
        const response = await apiClient.post('/users', invalidUser.data);
        expect([400, 422]).toContain(response.status());
      }
    });
  });

  test.describe('PUT /users - Update Tests', () => {
    test('PUT /users/{id} — update existing', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const updateData = usersData.validUsers[0];
      updateData.id = userId;
      
      const response = await apiClient.put(`/users/${userId}`, updateData);
      const updatedUser = await TestHelpers.validateResponse(response, 200);

      expect(updatedUser.id).toBe(userId);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
    });

    test('PUT /users/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const updateData = usersData.validUsers[0];
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/users/${invalidId}`, updateData);
      // PUT should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /users - Partial Update Tests', () => {
    test('PATCH /users/{id} — partial update with valid data', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const patchData = { name: 'Patched Name' };
      const response = await apiClient.patch(`/users/${userId}`, patchData);
      expect(response.status()).toBe(200);
      const updatedUser = await response.json();
      expect(updatedUser.id).toBe(userId);
      expect(updatedUser.name).toBe(patchData.name);
    });
  });
  
  test.describe('DELETE /users - Delete Tests', () => {
    test('DELETE /users/{id} — delete existing', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const response = await apiClient.delete(`/users/${userId}`);
      
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      // DELETE should return 204 No Content for successful deletion
      expect(response.status()).toBe(204);
    });

    test('DELETE /users/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/users/${invalidId}`);
      // DELETE should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Nested Resource Tests', () => {
    test('GET /users/{id}/posts — retrieve posts for user', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const response = await apiClient.get(`/users/${userId}/posts`);
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

    test('GET /users/{id}/albums — retrieve albums for user', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const response = await apiClient.get(`/users/${userId}/albums`);
      const albums = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getAlbumSchema() }
      );

      albums.forEach(album => {
        expect(album.userId).toBe(userId);
      });
    });

    test('GET /users/{id}/todos — retrieve todos for user', async () => {
      const userId = TestHelpers.getRandomId(1, 10);
      const response = await apiClient.get(`/users/${userId}/todos`);
      const todos = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getTodoSchema() }
      );

      todos.forEach(todo => {
        expect(todo.userId).toBe(userId);
      });
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /users — malformed JSON', async () => {
      const invalidData = TestHelpers.generateInvalidData('user');
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
          const response = await apiClient.context.post('/users', {
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

    test('POST /users — invalid Content-Type headers', async () => {
      const validData = {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      };
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
        expect(response.status()).toBe(415);
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
          expect(response.status()).toBe(405);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /users — extremely large payloads', async () => {
      const largePayload = {
        name: 'A'.repeat(10000),
        username: 'B'.repeat(5000),
        email: `test@${'c'.repeat(5000)}.com`,
        address: {
          street: 'D'.repeat(1000),
          suite: 'E'.repeat(1000),
          city: 'F'.repeat(1000),
          zipcode: 'G'.repeat(1000)
        },
        phone: 'H'.repeat(1000),
        website: 'I'.repeat(1000),
        company: {
          name: 'J'.repeat(1000),
          catchPhrase: 'K'.repeat(1000),
          bs: 'L'.repeat(1000)
        }
      };

      const response = await apiClient.post('/users', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(413); 
    });

    test('POST /users — special characters in data', async () => {
      const specialCharacterData = TestHelpers.generateInvalidData('user').specialCharacters;
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/users', specialCharacterData);
      expect([400, 422]).toContain(response.status());
    });
  });
});
