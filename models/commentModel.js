import BaseModel from './baseModel.js';
import { faker } from '@faker-js/faker';

export default class CommentModel extends BaseModel {
    constructor({ id, postId, name, email, body } = {}) {
        super({ id, postId, name, email, body });
    }

    static get validationRules() {
        return {
            id: { 
                type: 'number', 
                required: true,
                min: 1
            },
            postId: { 
                type: 'number', 
                required: true,
                min: 1,
                max: 100
            },
            name: { 
                type: 'string', 
                required: true,
                minLength: 2,
                maxLength: 100
            },
            email: { 
                type: 'string', 
                required: true,
                regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            body: { 
                type: 'string', 
                required: true,
                minLength: 10,
                maxLength: 500
            }
        };
    }

    static generate(postId = null) {
        return new CommentModel({
            postId: postId || faker.number.int({ min: 1, max: 100 }),
            name: faker.lorem.words(3),
            email: faker.internet.email(),
            body: faker.lorem.paragraph()
        });
    }

    static generateMinimal(postId = null) {
        return new CommentModel({
            postId: postId || faker.number.int({ min: 1, max: 100 }),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: faker.lorem.sentence()
        });
    }

    static generateWithInvalidEmail() {
        return new CommentModel({
            postId: 1,
            name: 'Test User',
            email: 'invalid-email',
            body: 'Test comment body with sufficient length'
        });
    }

    static generateWithSpecialCharacters() {
        return new CommentModel({
            postId: 1,
            name: 'Comment with special chars: !@#$%^&*()',
            email: 'test@example.com',
            body: 'Test comment with special characters: !@#$%^&*()'
        });
    }

    static generateLargePayload() {
        return new CommentModel({
            postId: 1,
            name: 'A'.repeat(10000),
            email: `test@${'b'.repeat(5000)}.com`,
            body: 'C'.repeat(50000)
        });
    }

    static generateRandomCommentId() {
        return faker.number.int({ min: 1, max: 500 });
    }

    static generateNonExistentCommentId() {
        return faker.number.int({ min: 1000, max: 9999 });
    }
}
