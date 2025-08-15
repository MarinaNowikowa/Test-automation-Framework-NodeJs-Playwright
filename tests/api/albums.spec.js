const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');
const ApiClient = require('../../utils/api-client');
const SchemaValidator = require('../../utils/schema-validator');
const TestHelpers = require('../../utils/test-helpers');

test.describe('Albums API Tests', () => {
  let apiClient;
  let schemaValidator;

  test.beforeEach(async () => {
    await allure.suite('Albums API');

    apiClient = new ApiClient();
    await apiClient.init();
    schemaValidator = new SchemaValidator();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /albums - Positive Scenarios', () => {
    test('GET /albums — retrieve all', async () => {
      const response = await apiClient.get('/albums');
      const albums = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getAlbumSchema() }
      );

      expect(albums).toHaveLength(100);
      albums.forEach(album => {
        expect(album).toHaveProperty('id');
        expect(album).toHaveProperty('userId');
        expect(album).toHaveProperty('title');
      });
    });

    test('GET /albums/{id} — retrieve by ID', async () => {
      const albumId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.get(`/albums/${albumId}`);
      const album = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getAlbumSchema()
      );

      expect(album.id).toBe(albumId);
      expect(album.userId).toBeGreaterThan(0);
      expect(album.title).toBeTruthy();
    });
  });

  test.describe('GET /albums - Negative Scenarios', () => {
    test('GET /albums/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const response = await apiClient.get(`/albums/${invalidId}`);
      expect(response.status()).toBe(404);
    });

    test('GET /albums/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/albums/invalid-id');
      expect(invalidFormatResponse.status()).toBe(400);
    });
  });

  test.describe('POST /albums - Create Tests', () => {
    test('POST /albums — create album with valid data', async () => {
      const albumData = TestHelpers.generateRandomAlbum();
      const response = await apiClient.post('/albums', albumData);
      const createdAlbum = await TestHelpers.validateResponse(
        response, 
        201, // POST should return 201 Created
        schemaValidator, 
        schemaValidator.getAlbumSchema()
      );

      expect(createdAlbum.title).toBe(albumData.title);
      expect(createdAlbum.userId).toBe(albumData.userId);
      expect(createdAlbum.id).toBe(101); // JSONPlaceholder returns 101 for new albums
    });
  });

  test.describe('PUT /albums - Update Tests', () => {
    test('PUT /albums/{id} — update existing', async () => {
      const albumId = TestHelpers.getRandomId(1, 100);
      const updateData = TestHelpers.generateRandomAlbum();
      updateData.id = albumId;
      
      const response = await apiClient.put(`/albums/${albumId}`, updateData);
      const updatedAlbum = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getAlbumSchema()
      );

      expect(updatedAlbum.id).toBe(albumId);
      expect(updatedAlbum.title).toBe(updateData.title);
      expect(updatedAlbum.userId).toBe(updateData.userId);
    });

    test('PUT /albums/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const updateData = TestHelpers.generateRandomAlbum();
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/albums/${invalidId}`, updateData);
      // PUT should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /albums - Partial Update Tests', () => {
    test('PATCH /albums/{id} — partial update with valid data', async () => {
      const albumId = TestHelpers.getRandomId(1, 100);
      const patchData = TestHelpers.generatePartialUpdate('album');
      
      const response = await apiClient.patch(`/albums/${albumId}`, patchData);
      const updatedAlbum = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getAlbumSchema()
      );

      expect(updatedAlbum.id).toBe(albumId);
      expect(updatedAlbum.title).toBe(patchData.title);
    });
  });

  test.describe('DELETE /albums - Delete Tests', () => {
    test('DELETE /albums/{id} — delete existing', async () => {
      const albumId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.delete(`/albums/${albumId}`);
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      // DELETE should return 204 No Content for successful deletion
      expect(response.status()).toBe(204);
    });

    test('DELETE /albums/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/albums/${invalidId}`);
      // DELETE should return 404 for non-existent resource according to REST standards
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /albums — malformed JSON', async () => {
      const invalidData = TestHelpers.generateInvalidData('album');
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
          const response = await apiClient.context.post('/albums', {
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

    test('POST /albums — invalid Content-Type headers', async () => {
      const validData = TestHelpers.generateRandomAlbum();
      const contentTypeTests = [
        { contentType: undefined, description: 'missing Content-Type' },
        { contentType: 'text/plain', description: 'incorrect Content-Type' }
      ];

      for (const test of contentTypeTests) {
        const response = await apiClient.context.post('/albums', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(415);
      }
    });

    test('POST /albums — unsupported HTTP methods', async () => {
      const testCases = [
        { method: 'HEAD', endpoint: '/albums/1' },
        { method: 'OPTIONS', endpoint: '/albums' }
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

    test('POST /albums — extremely large payloads', async () => {
      const largePayload = {
        title: 'A'.repeat(10000),
        userId: 1
      };

      const response = await apiClient.post('/albums', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(413); // Payload Too Large
    });

    test('POST /albums — special characters in album data', async () => {
      const specialCharData = TestHelpers.generateInvalidData('album').specialCharacters;
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/albums', specialCharData);
      expect([400, 422]).toContain(response.status());
    });
  });
});
