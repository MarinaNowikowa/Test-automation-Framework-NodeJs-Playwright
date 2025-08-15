const { faker } = require('@faker-js/faker');

class TestHelpers {
  static generateRandomPost() {
    return {
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(2),
      userId: faker.datatype.number({ min: 1, max: 10 })
    };
  }

  static generateRandomUser() {
    return {
      name: faker.person.fullName(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      address: {
        street: faker.location.streetAddress(),
        suite: faker.location.secondaryAddress(),
        city: faker.location.city(),
        zipcode: faker.location.zipCode(),
        geo: {
          lat: faker.location.latitude().toString(),
          lng: faker.location.longitude().toString()
        }
      },
      phone: faker.phone.number(),
      website: faker.internet.url(),
      company: {
        name: faker.company.name(),
        catchPhrase: faker.company.catchPhrase(),
        bs: faker.company.buzzPhrase()
      }
    };
  }

  static generateRandomComment(postId = null) {
    return {
      postId: postId || faker.number.int({ min: 1, max: 100 }),
      name: faker.lorem.words(3),
      email: faker.internet.email(),
      body: faker.lorem.paragraph()
    };
  }

  static generateRandomAlbum(userId = null) {
    return {
      title: faker.lorem.words(3),
      userId: userId || faker.number.int({ min: 1, max: 10 })
    };
  }

  static generateRandomPhoto(albumId = null) {
    const photoId = faker.number.int({ min: 1000, max: 9999 });
    return {
      albumId: albumId || faker.number.int({ min: 1, max: 100 }),
      title: faker.lorem.words(3),
      url: `https://via.placeholder.com/600/${photoId}`,
      thumbnailUrl: `https://via.placeholder.com/150/${photoId}`
    };
  }

  static generateRandomTodo(userId = null) {
    return {
      userId: userId || faker.number.int({ min: 1, max: 10 }),
      title: faker.lorem.sentence(),
      completed: faker.datatype.boolean()
    };
  }

  static generatePartialUpdate(entityType) {
    const updates = {
      post: {
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraph()
      },
      comment: {
        name: faker.person.fullName(),
        body: faker.lorem.paragraph()
      },
      album: {
        title: faker.lorem.words(3)
      },
      photo: {
        title: faker.lorem.words(3),
        url: `https://via.placeholder.com/600/${faker.number.int({ min: 1000, max: 9999 })}`
      },
      todo: {
        title: faker.lorem.sentence(),
        completed: Boolean(faker.datatype.boolean()) // Ensure it's always a boolean
      },
      user: {
        name: faker.person.fullName(),
        email: faker.internet.email()
      }
    };
    return updates[entityType] || {};
  }

  static generateInvalidData(entityType = 'post') {
    const invalidDataMap = {
      todo: {
        emptyObject: {},
        nullValues: {
          userId: null,
          title: null,
          completed: null
        },
        wrongTypes: {
          userId: "invalid",
          title: 123,
          completed: "not-a-boolean"
        },
        missingFields: {
          title: faker.lorem.words(3)
          // Missing userId and completed
        },
        extraFields: {
          userId: 1,
          title: faker.lorem.words(3),
          completed: false,
          extraField: "should not be here"
        },
        specialCharacters: {
          userId: 1,
          title: "Todo with 🎵 & special © characters ½",
          completed: false
        },
        booleanVariations: [
          true,
          false,
          "true",
          "false",
          1,
          0,
          "yes",
          "no",
          null,
          undefined
        ]
      },
      photo: {
        emptyObject: {},
        nullValues: {
          albumId: null,
          title: null,
          url: null,
          thumbnailUrl: null
        },
        wrongTypes: {
          albumId: "invalid",
          title: 123,
          url: true,
          thumbnailUrl: {}
        },
        missingFields: {
          title: faker.lorem.words(3),
          url: "https://example.com/photo.jpg"
          // Missing albumId and thumbnailUrl
        },
        extraFields: {
          albumId: 1,
          title: faker.lorem.words(3),
          url: "https://example.com/photo.jpg",
          thumbnailUrl: "https://example.com/thumb.jpg",
          extraField: "should not be here"
        },
        specialCharacters: {
          albumId: 1,
          title: "Photo with 🎵 & special © characters ½",
          url: "https://example.com/special-photo-🌟.jpg",
          thumbnailUrl: "https://example.com/special-thumb-✨.jpg"
        },
        invalidUrls: [
          "not-a-url",
          "ftp://invalid-protocol.com",
          "http:/missing-slash.com",
          "https://no-extension",
          "https://invalid#character.com",
          "https://multiple..dots.com",
          "https://space in url.com",
          "https://",
          "http://"
        ]
      },
      comment: {
        emptyObject: {},
        nullValues: {
          postId: null,
          name: null,
          email: null,
          body: null
        },
        wrongTypes: {
          postId: "invalid",
          name: 123,
          email: true,
          body: {}
        },
        missingFields: {
          name: faker.person.fullName(),
          email: faker.internet.email()
          // Missing postId and body
        },
        extraFields: {
          postId: 1,
          name: faker.person.fullName(),
          email: faker.internet.email(),
          body: faker.lorem.paragraph(),
          extraField: "should not be here"
        },
        specialCharacters: {
          postId: 1,
          name: "User 🚀 O'Connor & Señor",
          email: "special+chars@example.com",
          body: "Comment with 🎵 & special © characters ½"
        },
        invalidEmails: [
          "invalid-email-format",
          "missing@domain",
          "@nodomain.com",
          "spaces in@email.com",
          "multiple@@at.com",
          "no.tld@domain",
          ".starts.with.dot@domain.com",
          "ends.with.dot.@domain.com",
          "multiple..dots@domain.com"
        ]
      },
      album: {
        emptyObject: {},
        nullValues: {
          title: null,
          userId: null
        },
        wrongTypes: {
          title: 123,
          userId: "invalid"
        },
        missingFields: {
          title: faker.lorem.words(3)
          // Missing userId
        },
        extraFields: {
          title: faker.lorem.words(3),
          userId: 1,
          extraField: "should not be here"
        },
        specialCharacters: {
          title: "Album with 🎵 & special © characters ½",
          userId: 1
        }
      },
      post: {
        emptyObject: {},
        nullValues: {
          title: null,
          body: null,
          userId: null
        },
        wrongTypes: {
          title: 123,
          body: true,
          userId: "invalid"
        },
        missingFields: {
          title: faker.lorem.sentence()
          // Missing body and userId
        },
        extraFields: {
          title: faker.lorem.sentence(),
          body: faker.lorem.paragraph(),
          userId: 1,
          extraField: "should not be here"
        }
      },
      user: {
        emptyObject: {},
        nullValues: {
          name: null,
          username: null,
          email: null,
          address: null,
          phone: null,
          website: null,
          company: null
        },
        wrongTypes: {
          name: 123,
          username: true,
          email: 456,
          address: "not an object",
          phone: {},
          website: [],
          company: 789
        },
        missingFields: {
          name: faker.person.fullName()
          // Missing other required fields
        },
        extraFields: {
          name: faker.person.fullName(),
          username: faker.internet.userName(),
          email: faker.internet.email(),
          invalidField: "should not be here"
        },
        invalidEmails: [
          "invalid-email-format",
          "missing@domain",
          "@nodomain.com",
          "spaces in@email.com",
          "multiple@@at.com",
          "no.tld@domain",
          ".starts.with.dot@domain.com",
          "ends.with.dot.@domain.com",
          "multiple..dots@domain.com"
        ],
        specialCharacters: {
          name: "🚀 John O'Connor & Señor Smith",
          username: "user_with_$pecial_chars",
          email: "special.chars+test@example.com",
          address: {
            street: "Street No. 123 1/2",
            suite: "Suite #42 (a)",
            city: "Sao Paulo",
            zipcode: "12345-678"
          },
          phone: "+1 (555) 123-4567 ext.123",
          website: "http://example.com/~user",
          company: {
            name: "Company & Sons Ltd",
            catchPhrase: "100% satisfaction (c) 2024",
            bs: "innovative solutions"
          }
        }
      }
    };

    return invalidDataMap[entityType] || invalidDataMap.post;
  }

  static async validateResponse(response, expectedStatus, schemaValidator, schema) {
    const { expect } = require('@playwright/test');
    
    expect(response.status()).toBe(expectedStatus);

    const headers = response.headers();
    expect(headers['content-type']).toContain('application/json');

    const responseBody = await response.json();

    if (schemaValidator && schema) {
      const validation = schemaValidator.validate(schema, responseBody);
      if (!validation.valid) {
        console.error('Schema validation errors:', validation.errors);
      }
      expect(validation.valid).toBe(true);
    }

    return responseBody;
  }

  static async validateErrorResponse(response, expectedStatus) {
    const { expect } = require('@playwright/test');
    expect(response.status()).toBe(expectedStatus);
    
    try {
      const responseBody = await response.json();
      return responseBody;
    } catch (error) {
      return {};
    }
  }

  static getRandomId(min = 1, max = 100) {
    return faker.number.int({ min, max });
  }

  static getNonExistentId() {
    return faker.number.int({ min: 999, max: 9999 });
  }

  static generateLargePayload() {
    return {
      title: faker.lorem.words(1000),
      body: faker.lorem.paragraphs(100),
      userId: 1
    };
  }
}

module.exports = TestHelpers;
