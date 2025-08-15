const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');
const ApiClient = require('../../utils/api-client');
const SchemaValidator = require('../../utils/schema-validator');
const TestHelpers = require('../../utils/test-helpers');

test.describe('Photos API Tests', () => {
  let apiClient;
  let schemaValidator;

  test.beforeEach(async () => {
    await allure.suite('Photos API');
    
    apiClient = new ApiClient();
    await apiClient.init();
    schemaValidator = new SchemaValidator();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /photos - Positive Scenarios', () => {
    test('GET /photos — retrieve all', async () => {
      const response = await apiClient.get('/photos');
      const photos = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getPhotoSchema() }
      );

      expect(photos).toHaveLength(5000);
      photos.forEach(photo => {
        expect(photo).toHaveProperty('id');
        expect(photo).toHaveProperty('albumId');
        expect(photo).toHaveProperty('title');
        expect(photo).toHaveProperty('url');
        expect(photo).toHaveProperty('thumbnailUrl');
      });
    });

    test('GET /photos/{id} — retrieve by ID', async () => {
      const photoId = TestHelpers.getRandomId(1, 5000);
      const response = await apiClient.get(`/photos/${photoId}`);
      const photo = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getPhotoSchema()
      );

      expect(photo.id).toBe(photoId);
      expect(photo.albumId).toBeGreaterThan(0);
      expect(photo.title).toBeTruthy();
      expect(photo.url).toBeTruthy();
      expect(photo.thumbnailUrl).toBeTruthy();
    });

    test('GET /albums/{id}/photos — retrieve photos for a specific album', async () => {
      const albumId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.get(`/albums/${albumId}/photos`);
      const photos = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getPhotoSchema() }
      );

      photos.forEach(photo => {
        expect(photo.albumId).toBe(albumId);
        expect(typeof photo.albumId).toBe('number');
        expect(typeof photo.id).toBe('number');
        expect(typeof photo.title).toBe('string');
        expect(typeof photo.url).toBe('string');
        expect(typeof photo.thumbnailUrl).toBe('string');
      });
    });

    test('GET /photos?albumId={albumId} — retrieve photos by albumId query parameter', async () => {
      const albumId = TestHelpers.getRandomId(1, 100);
      const response = await apiClient.get(`/photos?albumId=${albumId}`);
      const photos = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        { type: 'array', items: schemaValidator.getPhotoSchema() }
      );

      photos.forEach(photo => {
        expect(photo.albumId).toBe(albumId);
        expect(typeof photo.albumId).toBe('number');
        expect(typeof photo.id).toBe('number');
        expect(typeof photo.title).toBe('string');
        expect(typeof photo.url).toBe('string');
        expect(typeof photo.thumbnailUrl).toBe('string');
      });
    });
  });

  test.describe('GET /photos - Negative Scenarios', () => {
    test('GET /photos/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const response = await apiClient.get(`/photos/${invalidId}`);
      expect(response.status()).toBe(404);
    });

    test('GET /photos/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/photos/invalid-id');
      expect(invalidFormatResponse.status()).toBe(400);
    });
  });

  test.describe('POST /photos - Create Tests', () => {
    test('POST /photos — create photo with valid data', async () => {
      const photoData = TestHelpers.generateRandomPhoto();
      const response = await apiClient.post('/photos', photoData);
      const createdPhoto = await TestHelpers.validateResponse(
        response, 
        201,
        schemaValidator, 
        schemaValidator.getPhotoSchema()
      );

      expect(createdPhoto.title).toBe(photoData.title);
      expect(createdPhoto.url).toBe(photoData.url);
      expect(createdPhoto.thumbnailUrl).toBe(photoData.thumbnailUrl);
      expect(createdPhoto.albumId).toBe(photoData.albumId);
      expect(createdPhoto.id).toBe(5001);
    });
  });

  test.describe('PUT /photos - Update Tests', () => {
    test('PUT /photos/{id} — update existing', async () => {
      const photoId = TestHelpers.getRandomId(1, 5000);
      const updateData = TestHelpers.generateRandomPhoto();
      updateData.id = photoId;
      
      const response = await apiClient.put(`/photos/${photoId}`, updateData);
      const updatedPhoto = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getPhotoSchema()
      );

      expect(updatedPhoto.id).toBe(photoId);
      expect(updatedPhoto.title).toBe(updateData.title);
      expect(updatedPhoto.url).toBe(updateData.url);
      expect(updatedPhoto.thumbnailUrl).toBe(updateData.thumbnailUrl);
      expect(updatedPhoto.albumId).toBe(updateData.albumId);
    });

    test('PUT /photos/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      const updateData = TestHelpers.generateRandomPhoto();
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/photos/${invalidId}`, updateData);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /photos - Partial Update Tests', () => {
    test('PATCH /photos/{id} — partial update with valid data', async () => {
      const photoId = TestHelpers.getRandomId(1, 5000);
      const patchData = TestHelpers.generatePartialUpdate('photo');
      
      const response = await apiClient.patch(`/photos/${photoId}`, patchData);
      const updatedPhoto = await TestHelpers.validateResponse(
        response, 
        200, 
        schemaValidator, 
        schemaValidator.getPhotoSchema()
      );

      expect(updatedPhoto.id).toBe(photoId);
      expect(updatedPhoto.title).toBe(patchData.title);
      expect(updatedPhoto.url).toBe(patchData.url);
    });
  });

  test.describe('DELETE /photos - Delete Tests', () => {
    test('DELETE /photos/{id} — delete existing', async () => {
      const photoId = TestHelpers.getRandomId(1, 5000);
      const response = await apiClient.delete(`/photos/${photoId}`);
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      expect(response.status()).toBe(204);
    });

    test('DELETE /photos/{id} — non-existent', async () => {
      const invalidId = TestHelpers.getNonExistentId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/photos/${invalidId}`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /photos — malformed JSON', async () => {
      const invalidData = TestHelpers.generateInvalidData('photo');
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
          const response = await apiClient.context.post('/photos', {
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

    test('POST /photos — invalid Content-Type headers', async () => {
      const validData = TestHelpers.generateRandomPhoto();
      const contentTypeTests = [
        { contentType: undefined, description: 'missing Content-Type' },
        { contentType: 'text/plain', description: 'incorrect Content-Type' }
      ];

      for (const test of contentTypeTests) {
        const response = await apiClient.context.post('/photos', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(415);
      }
    });

    test('POST /photos — unsupported HTTP methods', async () => {
      const testCases = [
        { method: 'HEAD', endpoint: '/photos/1' },
        { method: 'OPTIONS', endpoint: '/photos' }
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

    test('POST /photos — extremely large payloads', async () => {
      const largePayload = {
        albumId: 1,
        title: 'A'.repeat(10000),
        url: `https://example.com/${'b'.repeat(5000)}.jpg`,
        thumbnailUrl: `https://example.com/${'c'.repeat(5000)}.jpg`
      };

      const response = await apiClient.post('/photos', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(413);
    });

    test('POST /photos — special characters in photo data', async () => {
      const specialCharData = TestHelpers.generateInvalidData('photo').specialCharacters;
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/photos', specialCharData);
      expect([400, 422]).toContain(response.status());
    });

    test('POST /photos — validate URL formats in photo data', async () => {
      const invalidUrls = TestHelpers.generateInvalidData('photo').invalidUrls;
      for (const invalidUrl of invalidUrls) {
        const photoData = TestHelpers.generateRandomPhoto();
        photoData.url = invalidUrl;
        photoData.thumbnailUrl = invalidUrl;
        const response = await apiClient.post('/photos', photoData);
        await allure.issue('API-7', 'JSONPlaceholder should validate URL formats');
        expect(response.status()).toBe(400);
      }
    });
  });
});
