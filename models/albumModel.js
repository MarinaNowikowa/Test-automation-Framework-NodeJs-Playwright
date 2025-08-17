import BaseModel from './baseModel.js';
import { faker } from '@faker-js/faker';

export default class AlbumModel extends BaseModel {
    constructor({ id, userId, title } = {}) {
        super({ id, userId, title });
    }

    static get validationRules() {
        return {
            id: { 
                type: 'number', 
                required: true, 
                min: 1
            },
            userId: { 
                type: 'number', 
                required: true,
                min: 1,
                max: 10
            },
            title: { 
                type: 'string', 
                required: true,
                minLength: 3,
                maxLength: 100
            }
        };
    }

    static generate(userId = null) {
        return new AlbumModel({
            userId: userId || faker.number.int({ min: 1, max: 10 }),
            title: faker.lorem.words(3)
        });
    }

    static generateRandomAlbumId() {
        return faker.number.int({ min: 1, max: 100 });
    }

    static generateNonExistentAlbumId() {
        return faker.number.int({ min: 1000, max: 9999 });
    }

    static generatePartialUpdate() {
        return {
            title: faker.lorem.words(2)
        };
    }

    static generateWithSpecialCharacters() {
        return new AlbumModel({
            userId: 1,
            title: 'Album with special chars: !@#$%^&*()'
        });
    }

    static generateLargePayload() {
        return new AlbumModel({
            userId: 1,
            title: 'A'.repeat(10000)
        });
    }
}
