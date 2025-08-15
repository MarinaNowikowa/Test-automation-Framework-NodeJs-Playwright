# API Test Automation Framework

## Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MarinaNowikowa/Test-automation-Framework-NodeJs-Playwright.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

### Local Execution

Run all tests:
```bash
npm test
# or
npx playwright test
```

- By default, the Playwright configuration uses both the `line` reporter (for concise console output) and the `allure-playwright` reporter (for rich HTML reports). You will always see a real-time summary in the console and can generate a detailed Allure report after the run.

Run specific test file:
```bash
npx playwright test tests/api/<test-file>.spec.js
```

### Generating Reports

Generate Allure report:
```bash
npm run report:generate
```
- The Allure report is generated from the results in the `allure-results` folder. Console output is always available during test execution via the `line` reporter.

## Test Data Structure

### External Test Data Files
Located in `test-data/` directory:

1. `posts.json`:
   ```json
   {
     "validPosts": [...],
     "invalidPosts": [...],
     "updateData": [...]
   }
   ```

2. `users.json`:
   ```json
   {
     "validUsers": [...],
     "invalidUsers": [...]
   }
   ```

### Dynamic Test Data
- Generated using @faker-js/faker library (v8.3.1)
- Helpers in `utils/test-helpers.js`
- Supports various data patterns and edge cases

## Limitations and Known Issues

1. **API Limitations**
   - No actual data persistence
   - Limited server-side validation

2. **Framework Limitations**
   - No parallel test execution
   - No authentication testing

3. **Known API Issues and Bug Tickets**
   The following issues have been identified and tracked in Allure reports:

   - API-1: JSONPlaceholder returns 200 instead of 404 for non-existent resource
     - Affects: PUT requests to non-existent resources
     - Expected: 404 Not Found
     - Actual: 200 OK
     - Impact: Violates REST standards for resource existence validation

   - API-2: JSONPlaceholder returns 200 instead of 404 for deleting non-existent resource
     - Affects: DELETE requests to non-existent resources
     - Expected: 404 Not Found
     - Actual: 200 OK
     - Impact: No indication of resource existence

   - API-3: JSONPlaceholder should return 415 for missing/incorrect Content-Type
     - Affects: POST/PUT requests with invalid Content-Type
     - Expected: 415 Unsupported Media Type
     - Actual: Varies (200, 201)
     - Impact: Accepts requests with invalid content types

   - API-4: JSONPlaceholder returns 200 instead of 204 for successful deletion
     - Affects: DELETE operations
     - Expected: 204 No Content
     - Actual: 200 OK
     - Impact: Inconsistent with REST conventions

   - API-5: JSONPlaceholder should return 400 for malformed JSON
     - Affects: POST/PUT requests with invalid JSON
     - Expected: 400 Bad Request
     - Actual: Varies
     - Impact: Unclear error handling for malformed requests

   - API-6: JSONPlaceholder should return 405 for unsupported methods
     - Affects: Unsupported HTTP methods
     - Expected: 405 Method Not Allowed
     - Actual: Varies (200, 404)
     - Impact: Unclear method support indication

   - API-7: JSONPlaceholder should validate URL formats
     - Affects: Photo URLs validation
     - Expected: 400 Bad Request for invalid URLs
     - Actual: Accepts invalid URLs
     - Impact: Data integrity issues

   - API-8: JSONPlaceholder should validate boolean type for completed field
     - Affects: Todo completed field
     - Expected: 400 Bad Request for non-boolean values
     - Actual: Accepts invalid types
     - Impact: Data type consistency issues

   - API-9: JSONPlaceholder should return 413 for large payloads
     - Affects: Large request payloads
     - Expected: 413 Payload Too Large
     - Actual: Varies (201, 413)
     - Impact: Unclear payload size limits

   - API-10: JSONPlaceholder returns 404 instead of 400 for invalid ID format
     - Affects: All endpoints with ID path parameters (GET/PUT/DELETE/PATCH)
     - Expected: 400 Bad Request for invalid ID format
     - Actual: 404 Not Found
     - Impact: Does not distinguish between invalid format and non-existent resource

   - API-11: JSONPlaceholder allows creation with invalid special characters
     - Affects: POST requests with special characters in data
     - Expected: 400 Bad Request or 422 Unprocessable Entity
     - Actual: 201 Created or 200 OK
     - Impact: Accepts data that should be rejected by validation

   - API-12: JSONPlaceholder allows creation with invalid email format
     - Affects: POST /comments with invalid email
     - Expected: 400 Bad Request or 422 Unprocessable Entity
     - Actual: 201 Created or 200 OK
     - Impact: Accepts invalid email formats

   - API-13: JSONPlaceholder allows creation with invalid data from external file
     - Affects: POST /users, /posts with invalid data from test-data files
     - Expected: 400 Bad Request or 422 Unprocessable Entity
     - Actual: 201 Created or 200 OK
     - Impact: Accepts invalid data that should be rejected by validation