const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');
const ApiClient = require('../../utils/api-client');
const SchemaValidator = require('../../utils/schema-validator');
const TestHelpers = require('../../utils/test-helpers');

test.describe('Todos API Tests', () => {
  let apiClient;
  let schemaValidator;

  test.beforeEach(async () => {
    await allure.suite('Todos API');
    
    apiClient = new ApiClient();
    await apiClient.init();
    schemaValidator = new SchemaValidator();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /todos - Positive Scenarios', () => {
    test('GET /todos — retrieve all', async () => {
      const response = await apiClient.get('/todos');
      const todos = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getTodoSchema() }
      );

      expect(todos).toHaveLength(200);
      todos.forEach(todo => {
        expect(todo).toHaveProperty('id');
        expect(todo).toHaveProperty('userId');
        expect(todo).toHaveProperty('title');
        expect(todo).toHaveProperty('completed');
      });
    });

    test('GET /todos/{id} — retrieve by ID', async () => {
      const todoId = TestHelpers.getRandomId(1, 200);
      const response = await apiClient.get(`/todos/${todoId}`);
      const todo = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getTodoSchema()
      );

      expect(todo.id).toBe(todoId);
      expect(todo.userId).toBeGreaterThan(0);
      expect(todo.title).toBeTruthy();
    });
  });

  test.describe('GET /todos - Negative Scenarios', () => {
    test('GET /todos/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const response = await apiClient.get(`/todos/${invalidId}`);
      expect(response.status()).toBe(404);
    });

    test('GET /todos/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const response = await apiClient.get('/todos/invalid-id');
      expect(response.status()).toBe(400);
    });
  });

  test.describe('POST /todos - Create Tests', () => {
    test('POST /todos — create todo with valid data', async () => {
      const todoData = TestHelpers.generateRandomTodo();
      const response = await apiClient.post('/todos', todoData);
      const createdTodo = await TestHelpers.validateResponse(
        response, 
        201, 
        schemaValidator, 
        schemaValidator.getTodoSchema()
      );

      expect(createdTodo.title).toBe(todoData.title);
      expect(createdTodo.completed).toBe(todoData.completed);
      expect(createdTodo.userId).toBe(todoData.userId);
    });

  });

  test.describe('PUT /todos - Update Tests', () => {
    test('PUT /todos/{id} — update existing', async () => {
      const todoId = TestHelpers.getRandomId(1, 200);
      const updateData = TestHelpers.generateRandomTodo();
      updateData.id = todoId;
      
      const response = await apiClient.put(`/todos/${todoId}`, updateData);
      const updatedTodo = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getTodoSchema()
      );

      expect(updatedTodo.id).toBe(todoId);
      expect(updatedTodo.title).toBe(updateData.title);
      expect(updatedTodo.completed).toBe(updateData.completed);
      expect(updatedTodo.userId).toBe(updateData.userId);
    });

    test('PUT /todos/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const updateData = TestHelpers.generateRandomTodo();
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/todos/${invalidId}`, updateData);
      // PUT should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /todos - Partial Update Tests', () => {
    test('PATCH /todos/{id} — partial update with valid data', async () => {
      const todoId = TestHelpers.getRandomId(1, 200);
      const patchData = TestHelpers.generatePartialUpdate('todo');
      
      const response = await apiClient.patch(`/todos/${todoId}`, patchData);
      const updatedTodo = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getTodoSchema()
      );

      expect(updatedTodo.id).toBe(todoId);
      expect(updatedTodo.title).toBe(patchData.title);
      expect(updatedTodo.completed).toBe(patchData.completed);
    });
  });

  test.describe('DELETE /todos - Delete Tests', () => {
    test('DELETE /todos/{id} — delete existing', async () => {
      const todoId = TestHelpers.getRandomId(1, 200);
      const response = await apiClient.delete(`/todos/${todoId}`);
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      // DELETE should return 204 No Content for successful deletion
      expect(response.status()).toBe(204);
    });

    test('DELETE /todos/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/todos/${invalidId}`);
      // DELETE should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /todos — special characters in todo data', async () => {
      const specialCharData = TestHelpers.generateInvalidData('todo').specialCharacters;
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/todos', specialCharData);
      expect([400, 422]).toContain(response.status());
    });

    test('POST /todos — extremely large payloads', async () => {
      const largePayload = {
        userId: 1,
        title: 'A'.repeat(10000),
        completed: true
      };

      const response = await apiClient.post('/todos', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(413);
    });

    test('POST /todos — malformed JSON', async () => {
      const malformedData = [
        'invalid-json-string',
        '{"incomplete": json',
        null,
        undefined
      ];

      for (const data of malformedData) {
        try {
          const response = await apiClient.context.post('/todos', {
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

    test('POST /todos — invalid Content-Type headers', async () => {
      const validData = TestHelpers.generateRandomTodo();
      const contentTypeTests = [
        { contentType: undefined, description: 'missing Content-Type' },
        { contentType: 'text/plain', description: 'incorrect Content-Type' }
      ];

      for (const test of contentTypeTests) {
        const response = await apiClient.context.post('/todos', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(415);
      }
    });

    test('POST /todos — unsupported HTTP methods', async () => {
      const testCases = [
        { method: 'HEAD', endpoint: '/todos/1' },
        { method: 'OPTIONS', endpoint: '/todos' }
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
  });
});
