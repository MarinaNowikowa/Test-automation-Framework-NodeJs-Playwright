import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import ApiClient from '../../utils/api-client.js';
import { PhotoModel } from '../../models/index.js';
import HTTP_STATUS from '../../utils/http-status.js';
import { AllureHelpers } from '../../utils/allure-helpers.js';

test.describe('Photos API Tests', () => {
  let apiClient;

  test.beforeEach(async () => {
    await allure.suite('Photos API');
    
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /photos - Positive Scenarios', () => {
    test('GET /photos — retrieve all', async () => {
      const response = await apiClient.get('/photos');
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const photos = await response.json();
      expect(photos).toHaveLength(5000);
      
      for (const photo of photos) {
        const photoModel = new PhotoModel(photo);
        const validation = photoModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('PhotoModel', validation, photo);
        expect(validation.isValid).toBe(true);
      }
    });

    test('GET /photos/{id} — retrieve by ID', async () => {
      const photoId = PhotoModel.generateRandomPhotoId();
      const response = await apiClient.get(`/photos/${photoId}`);
      const photo = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const photoModel = new PhotoModel(photo);
      const validation = photoModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('PhotoModel', validation, photo);
      expect(validation.isValid).toBe(true);
    });

    test('GET /albums/{id}/photos — retrieve photos for a specific album', async () => {
      const albumId = PhotoModel.generateRandomPhotoId();
      const response = await apiClient.get(`/albums/${albumId}/photos`);
      const photos = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);

      for (const photo of photos) {
        expect(photo.albumId).toBe(albumId);
        const photoModel = new PhotoModel(photo);
        const validation = photoModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('PhotoModel', validation, photo);
        expect(validation.isValid).toBe(true);
      }
    });

    test('GET /photos?albumId={albumId} — retrieve photos by albumId query parameter', async () => {
      const albumId = PhotoModel.generateRandomPhotoId();
      const response = await apiClient.get(`/photos?albumId=${albumId}`);
      const photos = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);

      for (const photo of photos) {
        expect(photo.albumId).toBe(albumId);
        const photoModel = new PhotoModel(photo);
        const validation = photoModel.validate();
        await AllureHelpers.logModelValidationIfInvalid('PhotoModel', validation, photo);
        expect(validation.isValid).toBe(true);
      }
    });
  });

  test.describe('GET /photos - Negative Scenarios', () => {
    test('GET /photos/{id} — non-existent', async () => {
      const invalidId = PhotoModel.generateNonExistentPhotoId();
      const response = await apiClient.get(`/photos/${invalidId}`);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });

    test('GET /photos/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/photos/invalid-id');
      expect(invalidFormatResponse.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  test.describe('POST /photos - Create Tests', () => {
    test('POST /photos — create photo with valid data', async () => {
      const photoModel = PhotoModel.generate();
      const photoData = photoModel.toJson();
      
      const response = await apiClient.post('/photos', photoData);
      const createdPhoto = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.CREATED);
      
      const createdPhotoModel = new PhotoModel(createdPhoto);
      const validation = createdPhotoModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('PhotoModel', validation, createdPhoto);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('PUT /photos - Update Tests', () => {
    test('PUT /photos/{id} — update existing', async () => {
      const photoId = PhotoModel.generateRandomPhotoId();
      const photoModel = PhotoModel.generate();
      const updateData = photoModel.toJson();
      updateData.id = photoId;
      
      const response = await apiClient.put(`/photos/${photoId}`, updateData);
      const updatedPhoto = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedPhotoModel = new PhotoModel(updatedPhoto);
      const validation = updatedPhotoModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('PhotoModel', validation, updatedPhoto);
      expect(validation.isValid).toBe(true);
    });

    test('PUT /photos/{id} — non-existent', async () => {
      const invalidId = PhotoModel.generateNonExistentPhotoId();
      const photoModel = PhotoModel.generate();
      const updateData = photoModel.toJson();
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/photos/${invalidId}`, updateData);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('PATCH /photos - Partial Update Tests', () => {
    test('PATCH /photos/{id} — partial update with valid data', async () => {
      const photoId = PhotoModel.generateRandomPhotoId();
      const patchData = PhotoModel.generatePartialUpdate();
      
      const response = await apiClient.patch(`/photos/${photoId}`, patchData);
      const updatedPhoto = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedPhotoModel = new PhotoModel(updatedPhoto);
      const validation = updatedPhotoModel.validate();
      await AllureHelpers.logModelValidationIfInvalid('PhotoModel', validation, updatedPhoto);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('DELETE /photos - Delete Tests', () => {
    test('DELETE /photos/{id} — delete existing', async () => {
      const photoId = PhotoModel.generateRandomPhotoId();
      const response = await apiClient.delete(`/photos/${photoId}`);
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      expect(response.status()).toBe(HTTP_STATUS.NO_CONTENT);
    });

    test('DELETE /photos/{id} — non-existent', async () => {
      const invalidId = PhotoModel.generateNonExistentPhotoId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/photos/${invalidId}`);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /photos — malformed JSON', async () => {
      for (const data of PhotoModel.MALFORMED_JSON_DATA) {
        try {
          const response = await apiClient.context.post('/photos', {
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

    test('POST /photos — invalid Content-Type headers', async () => {
      const photoModel = PhotoModel.generate();
      const validData = photoModel.toJson();

      for (const test of PhotoModel.INVALID_CONTENT_TYPE_TESTS) {
        const response = await apiClient.context.post('/photos', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
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
          expect(response.status()).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /photos — extremely large payloads', async () => {
      const largePayloadPhoto = PhotoModel.generateLargePayload();
      const largePayload = largePayloadPhoto.toJson();

      const response = await apiClient.post('/photos', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    test('POST /photos — special characters in photo data', async () => {
      const specialCharPhoto = PhotoModel.generateWithSpecialCharacters();
      const specialCharData = specialCharPhoto.toJson();
      
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/photos', specialCharData);
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status());
    });

    test('POST /photos — validate URL formats in photo data', async () => {
      const invalidUrlPhotos = PhotoModel.generateWithInvalidUrls();
      
      for (const photoModel of invalidUrlPhotos) {
        const photoData = photoModel.toJson();
        const response = await apiClient.post('/photos', photoData);
        await allure.issue('API-7', 'JSONPlaceholder should validate URL formats');
        expect(response.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      }
    });
  });
});
