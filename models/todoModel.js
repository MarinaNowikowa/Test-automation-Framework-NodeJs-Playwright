import BaseModel from './baseModel.js';
import { faker } from '@faker-js/faker';

export default class TodoModel extends BaseModel {
    constructor({ id, userId, title, completed } = {}) {
        super({ id, userId, title, completed });
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
                maxLength: 200
            },
            completed: { 
                type: 'boolean', 
                required: true
            }
        };
    }

    static generate(userId = null) {
        return new TodoModel({
            userId: userId || faker.number.int({ min: 1, max: 10 }),
            title: faker.lorem.sentence(),
            completed: faker.datatype.boolean()
        });
    }

    static generateRandomTodoId() {
        return faker.number.int({ min: 1, max: 200 });
    }

    static generateNonExistentTodoId() {
        return faker.number.int({ min: 1000, max: 9999 });
    }

    static generatePartialUpdate() {
        return {
            title: faker.lorem.sentence(),
            completed: faker.datatype.boolean()
        };
    }

    static generateWithSpecialCharacters() {
        return new TodoModel({
            userId: 1,
            title: '🚀 Todo with émojis & spëcial çhars: !@#$%^&*()',
            completed: true
        });
    }

    static generateLargePayload() {
        return new TodoModel({
            userId: 1,
            title: 'A'.repeat(10000),
            completed: true
        });
    }
}
