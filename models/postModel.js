import BaseModel from './baseModel.js';
import { faker } from '@faker-js/faker';

export default class PostModel extends BaseModel {
    constructor({ id, userId, title, body } = {}) {
        super({ id, userId, title, body });
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
                minLength: 5,
                maxLength: 200
            },
            body: { 
                type: 'string', 
                required: true,
                minLength: 10,
                maxLength: 1000
            }
        };
    }

    static generate(userId = null) {
        return new PostModel({
            userId: userId || faker.number.int({ min: 1, max: 10 }),
            title: faker.lorem.sentence(),
            body: faker.lorem.paragraphs(2)
        });
    }

    static generateRandomPostId() {
        return faker.number.int({ min: 1, max: 100 });
    }

    static generateNonExistentPostId() {
        return faker.number.int({ min: 1000, max: 9999 });
    }

    static generatePartialUpdate() {
        return {
            title: faker.lorem.sentence(),
            body: faker.lorem.paragraph()
        };
    }

    static generateWithSpecialCharacters() {
        return new PostModel({
            userId: 1,
            title: '🚀 Test with émojis & spëcial çhars',
            body: 'Body with special chars: <script>alert("test")</script> & symbols: ©®™'
        });
    }

    static generateLargePayload() {
        return new PostModel({
            userId: 1,
            title: 'A'.repeat(10000),
            body: 'B'.repeat(50000)
        });
    }
}
