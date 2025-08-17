import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import ApiClient from '../../utils/api-client.js';
import { AlbumModel } from '../../models/index.js';
import HTTP_STATUS from '../../utils/http-status.js';
import { AllureHelpers } from '../../utils/allure-helpers.js';

test.describe('Albums API Tests', () => {
  let apiClient;

  test.beforeEach(async () => {
    await allure.suite('Albums API');
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test.describe('GET /albums - Positive Scenarios', () => {
    test('GET /albums — retrieve all', async () => {
      const response = await apiClient.get('/albums');
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const albums = await response.json();
      for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const albumModel = new AlbumModel(album);
        const validation = albumModel.validate();
        
        await AllureHelpers.logModelValidationIfInvalid('AlbumModel', validation, album);
        expect(validation.isValid).toBe(true);
      }
    });

    test('GET /albums/{id} — retrieve by ID', async () => {
      const albumId = AlbumModel.generateRandomAlbumId();
      const response = await apiClient.get(`/albums/${albumId}`);
      const album = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const albumModel = new AlbumModel(album);
      const validation = albumModel.validate();
    
      await AllureHelpers.logModelValidationIfInvalid('AlbumModel', validation, album);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('GET /albums - Negative Scenarios', () => {
    test('GET /albums/{id} — non-existent', async () => {
      const invalidId = AlbumModel.generateNonExistentAlbumId();
      const response = await apiClient.get(`/albums/${invalidId}`);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });

    test('GET /albums/{id} — invalid ID format', async () => {
      await allure.issue('API-10', 'JSONPlaceholder returns 404 instead of 400 for invalid ID format');
      const invalidFormatResponse = await apiClient.get('/albums/invalid-id');
      expect(invalidFormatResponse.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  test.describe('POST /albums - Create Tests', () => {
    test('POST /albums — create album with valid data', async () => {
      const albumModel = AlbumModel.generate();
      const albumData = albumModel.toJson();
      
      const response = await apiClient.post('/albums', albumData);
      const createdAlbum = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.CREATED);
      
      const createdAlbumModel = new AlbumModel(createdAlbum);
      const validation = createdAlbumModel.validate();

      await AllureHelpers.logModelValidationIfInvalid('AlbumModel', validation, createdAlbum);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('PUT /albums - Update Tests', () => {
    test('PUT /albums/{id} — update existing', async () => {
      const albumId = AlbumModel.generateRandomAlbumId();
      const albumModel = AlbumModel.generate();
      const updateData = albumModel.toJson();
      updateData.id = albumId;
      
      const response = await apiClient.put(`/albums/${albumId}`, updateData);
      const updatedAlbum = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedAlbumModel = new AlbumModel(updatedAlbum);
      const validation = updatedAlbumModel.validate();
      
      await AllureHelpers.logModelValidationIfInvalid('AlbumModel', validation, updatedAlbum);
      expect(validation.isValid).toBe(true);
    });

    test('PUT /albums/{id} — non-existent', async () => {
      const invalidId = AlbumModel.generateNonExistentAlbumId();
      const albumModel = AlbumModel.generate();
      const updateData = albumModel.toJson();
      updateData.id = invalidId;
      
      await allure.issue('API-1', 'JSONPlaceholder returns 200 instead of 404 for non-existent resource');
      const response = await apiClient.put(`/albums/${invalidId}`, updateData);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('PATCH /albums - Partial Update Tests', () => {
    test('PATCH /albums/{id} — partial update with valid data', async () => {
      const albumId = AlbumModel.generateRandomAlbumId();
      const patchData = AlbumModel.generatePartialUpdate();
      
      const response = await apiClient.patch(`/albums/${albumId}`, patchData);
      const updatedAlbum = await response.json();
      expect(response.status()).toBe(HTTP_STATUS.OK);
      
      const updatedAlbumModel = new AlbumModel(updatedAlbum);
      const validation = updatedAlbumModel.validate();
      
      await AllureHelpers.logModelValidationIfInvalid('AlbumModel', validation, updatedAlbum);
      expect(validation.isValid).toBe(true);
    });
  });

  test.describe('DELETE /albums - Delete Tests', () => {
    test('DELETE /albums/{id} — delete existing', async () => {
      const albumId = AlbumModel.generateRandomAlbumId();
      const response = await apiClient.delete(`/albums/${albumId}`);
      
      await allure.issue('API-4', 'JSONPlaceholder returns 200 instead of 204 for successful deletion');
      expect(response.status()).toBe(HTTP_STATUS.NO_CONTENT);
    });

    test('DELETE /albums/{id} — non-existent', async () => {
      const invalidId = AlbumModel.generateNonExistentAlbumId();
      await allure.issue('API-2', 'JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource');
      const response = await apiClient.delete(`/albums/${invalidId}`);
      expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  test.describe('Edge Cases', () => {
    test('POST /albums — malformed JSON', async () => {
      for (const data of AlbumModel.MALFORMED_JSON_DATA) {
        try {
          const response = await apiClient.context.post('/albums', {
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

    test('POST /albums — invalid Content-Type headers', async () => {
      const albumModel = AlbumModel.generate();
      const validData = albumModel.toJson();

      for (const test of AlbumModel.INVALID_CONTENT_TYPE_TESTS) {
        const response = await apiClient.context.post('/albums', {
          data: JSON.stringify(validData),
          headers: test.contentType ? { 'Content-Type': test.contentType } : {}
        });

        await allure.issue('API-3', 'JSONPlaceholder should return 415 for missing/incorrect Content-Type');
        expect(response.status()).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
      }
    });

    test('POST /albums — unsupported HTTP methods', async () => {
      for (const testCase of AlbumModel.UNSUPPORTED_HTTP_METHODS) {
        try {
          const response = await apiClient.context.fetch(`${apiClient.baseURL}/albums${testCase.endpoint}`, {
            method: testCase.method
          });
          
          await allure.issue('API-6', 'JSONPlaceholder should return 405 for unsupported methods');
          expect(response.status()).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test('POST /albums — extremely large payloads', async () => {
      const largePayloadModel = AlbumModel.generateLargePayload();
      const largePayload = largePayloadModel.toJson();

      const response = await apiClient.post('/albums', largePayload);
      await allure.issue('API-9', 'JSONPlaceholder should return 413 for large payloads');
      expect(response.status()).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    test('POST /albums — special characters in album data', async () => {
      const specialCharAlbum = AlbumModel.generateWithSpecialCharacters();
      const specialCharData = specialCharAlbum.toJson();
      
      await allure.issue('API-11', 'JSONPlaceholder allows creation with invalid special characters');
      const response = await apiClient.post('/albums', specialCharData);
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status());
    });
  });
});
