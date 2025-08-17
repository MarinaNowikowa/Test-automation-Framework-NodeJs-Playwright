import BaseModel from './baseModel.js';
import { faker } from '@faker-js/faker';

export default class PhotoModel extends BaseModel {
    constructor({ id, albumId, title, url, thumbnailUrl } = {}) {
        super({ id, albumId, title, url, thumbnailUrl });
    }

    static get validationRules() {
        return {
            id: { 
                type: 'number', 
                required: true,
                min: 1
            },
            albumId: { 
                type: 'number', 
                required: true,
                min: 1,
                max: 100
            },
            title: { 
                type: 'string', 
                required: true,
                minLength: 3,
                maxLength: 100
            },
            url: { 
                type: 'string', 
                required: true,
                regex: /^https?:\/\/.+/
            },
            thumbnailUrl: { 
                type: 'string', 
                required: true,
                regex: /^https?:\/\/.+/
            }
        };
    }

    static generate(albumId = null) {
        const photoId = faker.number.int({ min: 1000, max: 9999 });
        return new PhotoModel({
            albumId: albumId || faker.number.int({ min: 1, max: 100 }),
            title: faker.lorem.words(3),
            url: `https://via.placeholder.com/600/${photoId}`,
            thumbnailUrl: `https://via.placeholder.com/150/${photoId}`
        });
    }





    static generateRandomPhotoId() {
        return faker.number.int({ min: 1, max: 5000 });
    }

    static generateNonExistentPhotoId() {
        return faker.number.int({ min: 10000, max: 99999 });
    }

    static generatePartialUpdate() {
        return {
            title: faker.lorem.words(2),
            url: `https://via.placeholder.com/600/${faker.number.int({ min: 1000, max: 9999 })}`
        };
    }

    static generateWithSpecialCharacters() {
        return new PhotoModel({
            albumId: 1,
            title: 'Photo with special chars: !@#$%^&*()',
            url: 'https://example.com/photo.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg'
        });
    }

    static generateLargePayload() {
        return new PhotoModel({
            albumId: 1,
            title: 'A'.repeat(10000),
            url: `https://example.com/${'b'.repeat(5000)}.jpg`,
            thumbnailUrl: `https://example.com/${'c'.repeat(5000)}.jpg`
        });
    }

    static generateWithInvalidUrls() {
        return [
            new PhotoModel({
                albumId: 1,
                title: 'Test Photo',
                url: 'not-a-url',
                thumbnailUrl: 'https://example.com/thumb.jpg'
            }),
            new PhotoModel({
                albumId: 1,
                title: 'Test Photo',
                url: 'https://example.com/photo.jpg',
                thumbnailUrl: 'not-a-url'
            }),
            new PhotoModel({
                albumId: 1,
                title: 'Test Photo',
                url: 'ftp://example.com/photo.jpg',
                thumbnailUrl: 'https://example.com/thumb.jpg'
            })
        ];
    }
}
