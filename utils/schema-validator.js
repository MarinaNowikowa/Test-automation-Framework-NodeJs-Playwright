const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class SchemaValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  validate(schema, data) {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);
    
    return {
      valid,
      errors: validate.errors
    };
  }

  getPostSchema() {
    return {
      type: 'object',
      properties: {
        userId: { type: 'integer' },
        id: { type: 'integer' },
        title: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['userId', 'id', 'title', 'body'],
      additionalProperties: false
    };
  }

  getUserSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            suite: { type: 'string' },
            city: { type: 'string' },
            zipcode: { type: 'string' },
            geo: {
              type: 'object',
              properties: {
                lat: { type: 'string' },
                lng: { type: 'string' }
              }
            }
          }
        },
        phone: { type: 'string' },
        website: { type: 'string' },
        company: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            catchPhrase: { type: 'string' },
            bs: { type: 'string' }
          }
        }
      },
      required: ['id', 'name', 'username', 'email'],
      additionalProperties: false
    };
  }

  getCommentSchema() {
    return {
      type: 'object',
      properties: {
        postId: { type: 'integer' },
        id: { type: 'integer' },
        name: { type: 'string' },
        email: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['postId', 'id', 'name', 'email', 'body'],
      additionalProperties: false
    };
  }

  getAlbumSchema() {
    return {
      type: 'object',
      properties: {
        userId: { type: 'integer' },
        id: { type: 'integer' },
        title: { type: 'string' }
      },
      required: ['userId', 'id', 'title'],
      additionalProperties: false
    };
  }

  getTodoSchema() {
    return {
      type: 'object',
      properties: {
        userId: { type: 'integer' },
        id: { type: 'integer' },
        title: { type: 'string' },
        completed: { type: 'boolean' }
      },
      required: ['userId', 'id', 'title', 'completed'],
      additionalProperties: false
    };
  }

  getPhotoSchema() {
    return {
      type: 'object',
      properties: {
        albumId: { type: 'integer' },
        id: { type: 'integer' },
        title: { type: 'string' },
        url: { type: 'string' },
        thumbnailUrl: { type: 'string' }
      },
      required: ['albumId', 'id', 'title', 'url', 'thumbnailUrl'],
      additionalProperties: false
    };
  }

  getErrorSchema() {
    return {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      },
      additionalProperties: true
    };
  }
}

module.exports = SchemaValidator;
