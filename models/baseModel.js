export default class BaseModel {

    static get MALFORMED_JSON_DATA() {
        return [
            'invalid-json-string',
            '{"incomplete": json',
            null,
            undefined
        ];
    }

    static get INVALID_CONTENT_TYPE_TESTS() {
        return [
            { contentType: undefined, description: 'missing Content-Type' },
            { contentType: 'text/plain', description: 'incorrect Content-Type' }
        ];
    }

    static get UNSUPPORTED_HTTP_METHODS() {
        return [
            { method: 'HEAD', endpoint: '/1' },
            { method: 'OPTIONS', endpoint: '' }
        ];
    }
    constructor(data = {}) {
        Object.assign(this, data);
    }

    static fromJson(json) {
        return new this(json);
    }

    toJson() {
        return {...this};
    }

    static generate() {
        throw new Error('generate() method must be implemented in child class');
    }

    static generateMultiple(count = 1) {
        return Array.from({ length: count }, () => this.generate());
    }

    validate() {
        const rules = this.constructor.validationRules;
        if (!rules) {
            return { isValid: true, errors: [] };
        }

        const errors = [];
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = this[field];
            
            // Check if required field is present
            if (rule.required !== false && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            // Skip validation if value is not present and not required
            if (value === undefined || value === null) {
                continue;
            }

            // Type validation
            if (rule.type && typeof value !== rule.type) {
                errors.push(`${field} must be of type ${rule.type}`);
            }

            // Regex validation
            if (rule.regex && !rule.regex.test(value)) {
                errors.push(`${field} does not match required pattern`);
            }

            // Min/Max validation for strings
            if (rule.type === 'string') {
                if (rule.minLength && value.length < rule.minLength) {
                    errors.push(`${field} must be at least ${rule.minLength} characters long`);
                }
                if (rule.maxLength && value.length > rule.maxLength) {
                    errors.push(`${field} must be no more than ${rule.maxLength} characters long`);
                }
            }

            // Min/Max validation for numbers
            if (rule.type === 'number') {
                if (rule.min !== undefined && value < rule.min) {
                    errors.push(`${field} must be at least ${rule.min}`);
                }
                if (rule.max !== undefined && value > rule.max) {
                    errors.push(`${field} must be no more than ${rule.max}`);
                }
            }

            // Custom validation function
            if (rule.validate && typeof rule.validate === 'function') {
                const customError = rule.validate(value);
                if (customError) {
                    errors.push(customError);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
