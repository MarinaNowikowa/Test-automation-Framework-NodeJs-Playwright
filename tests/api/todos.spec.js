import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import ApiClient from '../../utils/api-client.js';
import { TodoModel } from '../../models/index.js';
import HTTP_STATUS from '../../utils/http-status.js';
import { AllureHelpers } from '../../utils/allure-helpers.js';

test.describe('Todos API Tests', () => {
  let apiClient;

  test.beforeEach(async () => {
    await allure.suite('Todos API');
    
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /todos - Positive Scenarios', () => {
          test('GET /todos — retrieve all', async () => {
        const response = await apiClient.get('/todos');
        expect(response.status()).toBe(HTTP_STATUS.OK);
        
        const todos = await response.json();
        expect(todos).toHaveLength(200);
        
        for (const todo of todos) {
          const todoModel = new TodoModel(todo);
          const validation = todoModel.validate();
          await AllureHelpers.logModelValidationIfInvalid('TodoModel', validation, todo);
          expect(validation.isValid).toBe(true);
        }
      });

          test('GET /todos/{id} — retrieve by ID', async () => {
        const todoId = TodoModel.generateRandomTodoId();
        const response = await apiClient.get(`/todos/${todoId}`);
        const todo = await response.json();
        expect(response.status()).toBe(HTTP_STATUS.OK);
        
        const todoModel = new TodoModel(todo);
        const validation = todoModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('TodoModel', validation, todo);
        expect(validation.isValid).toBe(true);
      });
  });

  test.describe('GET /todos - Negative Scenarios', () => {
          test('GET /todos/{id} — non-existent', async () => {
        const invalidId = TodoModel.generateNonExistentTodoId();
        const response = await apiClient.get(`/todos/${invalidId}`);
        expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
      });

    test('GET /todos/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const response = await apiClient.get('/todos/invalid-id');
      expect(response.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  test.describe('POST /todos - Create Tests', () => {
    test('POST /todos — create todo with valid data', async () => {
      const todoModel = TodoModel.generate();
      const todoData = todoModel.toJson();
      const response = await apiClient.post('/todos', todoData);
      const createdTodo = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.CREATED);
      
      const createdTodoModel = new TodoModel(createdTodo);
      const validation = createdTodoModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('TodoModel', validation, createdTodo);
      expect(validation.isValid).toBe(true);
    });

  });

  test.describe('PUT /todos - Update Tests', () => {
    test('PUT /todos/{id} — update existing', async () => {
      const todoId = TodoModel.generateRandomTodoId();
      const todoModel = TodoModel.generate();
      const updateData = todoModel.toJson();
      updateData.id = todoId;
      
      const response = await apiClient.put(`/todos/${todoId}`, updateData);
      const updatedTodo = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedTodoModel = new TodoModel(updatedTodo);
      const validation = updatedTodoModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('TodoModel', validation, updatedTodo);
      expect(validation.isValid).toBe(true);
    });

    test('PUT /todos/{id} — non-existent', async () => {
      const invalidId = TodoModel.generateNonExistentTodoId();
      const todoModel = TodoModel.generate();
      const updateData = todoModel.toJson();
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/todos/${invalidId}`, updateData);
      // PUT should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('PATCH /todos - Partial Update Tests', () => {
    test('PATCH /todos/{id} — partial update with valid data', async () => {
      const todoId = TodoModel.generateRandomTodoId();
      const patchData = TodoModel.generatePartialUpdate();
      
      const response = await apiClient.patch(`/todos/${todoId}`, patchData);
      const updatedTodo = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedTodoModel = new TodoModel(updatedTodo);
      const validation = updatedTodoModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('TodoModel', validation, updatedTodo);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('DELETE /todos - Delete Tests', () => {
    test('DELETE /todos/{id} — delete existing', async () => {
      const todoId = TodoModel.generateRandomTodoId();
      const response = await apiClient.delete(`/todos/${todoId}`);
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      // DELETE should return 204 No Content for successful deletion
      expect(response.status()).toBe(HTTP_STATUS.NO_CONTENT);
    });

    test('DELETE /todos/{id} — non-existent', async () => {
      const invalidId = TodoModel.generateNonExistentTodoId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/todos/${invalidId}`);
      // DELETE should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /todos — special characters in todo data', async () => {
      const specialCharModel = TodoModel.generateWithSpecialCharacters();
      const specialCharData = specialCharModel.toJson();
      
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/todos', specialCharData);
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status());
    });

    test('POST /todos — extremely large payloads', async () => {
      const largePayloadModel = TodoModel.generateLargePayload();
      const largePayload = largePayloadModel.toJson();

      const response = await apiClient.post('/todos', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    test('POST /todos — malformed JSON', async () => {
      for (const data of TodoModel.MALFORMED_JSON_DATA) {
        try {
          const response = await apiClient.context.post('/todos', {
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

    test('POST /todos — invalid Content-Type headers', async () => {
      const todoModel = TodoModel.generate();
      const validData = todoModel.toJson();
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
        expect(response.status()).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
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
          expect(response.status()).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });
  });
});
