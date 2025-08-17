import BaseModel from './baseModel.js';
import { faker } from '@faker-js/faker';

export default class UserModel extends BaseModel {
    constructor({ 
        id, 
        name, 
        username, 
        email, 
        address, 
        phone, 
        website, 
        company 
    } = {}) {
        super({ id, name, username, email, address, phone, website, company });
    }

    static get validationRules() {
        return {
            id: { 
                type: 'number', 
                required: true,
                min: 1
            },
            name: { 
                type: 'string', 
                required: true,
                minLength: 2,
                maxLength: 100
            },
            username: { 
                type: 'string', 
                required: true,
                minLength: 3,
                maxLength: 20,
                regex: /^[A-Za-z0-9_\.]+$/
            },
            email: { 
                type: 'string', 
                required: true,
                regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                validate: (value) => {
                    if (!value.includes('@')) {
                        return 'Email must contain @ symbol';
                    }
                    return null;
                }
            },
            address: {
                type: 'object',
                required: true,
                validate: (value) => {
                    if (!value || typeof value !== 'object') {
                        return 'Address must be an object';
                    }
                    if (!value.street || !value.city) {
                        return 'Address must have street and city';
                    }
                    return null;
                }
            },
            phone: {
                type: 'string',
                required: false,
                validate: (value) => {
                    if (value && !/^[\d\-\+\(\)\s\.x]+$/.test(value)) {
                        return 'Phone must contain only digits, spaces, dashes, parentheses, dots and x';
                    }
                    return null;
                }
            },
            website: {
                type: 'string',
                required: false,
                validate: (value) => {
                    if (value && !value.includes('.') && !value.startsWith('http://') && !value.startsWith('https://')) {
                        return 'Website must be a valid domain or URL';
                    }
                    return null;
                }
            },
            company: {
                type: 'object',
                required: false,
                validate: (value) => {
                    if (value && (!value.name || typeof value.name !== 'string')) {
                        return 'Company must have a name';
                    }
                    return null;
                }
            }
        };
    }

    static generate() {
        const address = {
            street: faker.location.streetAddress(),
            suite: faker.location.secondaryAddress(),
            city: faker.location.city(),
            zipcode: faker.location.zipCode(),
            geo: {
                lat: faker.location.latitude().toString(),
                lng: faker.location.longitude().toString()
            }
        };

        const company = {
            name: faker.company.name(),
            catchPhrase: faker.company.catchPhrase(),
            bs: faker.company.buzzPhrase()
        };

        return new UserModel({
            name: faker.person.fullName(),
            username: faker.internet.userName(),
            email: faker.internet.email(),
            address,
            phone: faker.phone.number(),
            website: faker.internet.url(),
            company
        });
    }

    static generateRandomUserId() {
        return faker.number.int({ min: 1, max: 10 });
    }

    static generateNonExistentUserId() {
        return faker.number.int({ min: 100, max: 999 });
    }

    static generatePartialUpdate() {
        return {
            name: faker.person.fullName(),
            email: faker.internet.email()
        };
    }

    static generateWithSpecialCharacters() {
        return new UserModel({
            name: '🚀 User with émojis & spëcial çhars: !@#$%^&*()',
            username: 'special_user_123',
            email: 'special@example.com',
            address: {
                street: 'Special Street 123',
                city: 'Special City',
                zipcode: '12345'
            }
        });
    }

    static generateLargePayload() {
        return new UserModel({
            name: 'A'.repeat(10000),
            username: 'B'.repeat(5000),
            email: `test@${'c'.repeat(5000)}.com`,
            address: {
                street: 'D'.repeat(1000),
                suite: 'E'.repeat(1000),
                city: 'F'.repeat(1000),
                zipcode: 'G'.repeat(1000)
            },
            phone: 'H'.repeat(1000),
            website: 'I'.repeat(1000),
            company: {
                name: 'J'.repeat(1000),
                catchPhrase: 'K'.repeat(1000),
                bs: 'L'.repeat(1000)
            }
        });
    }
}
