# API Test Cases

## Albums API

### GET /albums — retrieve all
- Description: Verify full list of albums is returned and matches schema; length should be 100.
- Precondition: API reachable; API client initialized.
- Steps:
  1. GET /albums.
  2. Validate response status and schema (array of album schema).
  3. Assert length is 100 and each item has id, userId, title.
- Expected result: 200 OK; array of 100 valid album objects.

### GET /albums/{id} — retrieve by ID
- Description: Verify a single album can be fetched by a valid ID (1–100).
- Precondition: API reachable; choose random albumId in [1..100].
- Steps:
  1. GET /albums/{albumId}.
  2. Validate 200 and album schema.
  3. Assert id === albumId, userId > 0, title non-empty.
- Expected result: 200 OK; valid album object for the requested id.

### GET /albums/{id} — non-existent
- Description: Request album with an ID that doesn’t exist.
- Precondition: Generate id not in dataset (e.g., TestHelpers.getNonExistentId()).
- Steps:
  1. GET /albums/{invalidId}.
- Expected result: 404 Not Found.

### GET /albums/{id} — invalid ID format
- Description: Invalid path parameter format should be rejected.
- Precondition: API reachable.
- Steps:
  1. GET /albums/invalid-id.
- Expected result: 400 Bad Request (known deviation: service returns 404).

### POST /albums — create with valid data
- Description: Create an album with valid payload; verify schema and returned fields.
- Precondition: Prepare albumData = TestHelpers.generateRandomAlbum().
- Steps:
  1. POST /albums with albumData; validate schema.
- Expected result: 201 Created; body echoes title/userId, and id === 101 per backend behavior.

### PUT /albums/{id} — update existing
- Description: Full update of an existing album.
- Precondition: Pick albumId in [1..100]; updateData with id = albumId.
- Steps:
  1. PUT /albums/{albumId} with updateData; validate schema.
- Expected result: 200 OK; response contains updated title, userId, and id === albumId.

### PUT /albums/{id} — non-existent
- Description: Updating a non-existent album should be rejected (spec compliance).
- Precondition: invalidId = TestHelpers.getNonExistentId(); set updateData.id = invalidId.
- Steps:
  1. PUT /albums/{invalidId} with updateData.
- Expected result: 404 Not Found (known deviation: service returns 200).

### PATCH /albums/{id} — partial update
- Description: Partial update of an existing album (e.g., title).
- Precondition: Choose albumId in [1..100]; patchData = TestHelpers.generatePartialUpdate('album').
- Steps:
  1. PATCH /albums/{albumId} with patchData; validate schema.
- Expected result: 200 OK; response reflects partial changes and correct id.

### DELETE /albums/{id} — delete existing
- Description: Deleting an existing album should be a no-content success.
- Precondition: Pick albumId in [1..100].
- Steps:
  1. DELETE /albums/{albumId}.
- Expected result: 204 No Content (known deviation: service returns 200).

### DELETE /albums/{id} — non-existent
- Description: Deleting a non-existent album should be rejected.
- Precondition: invalidId = TestHelpers.getNonExistentId().
- Steps:
  1. DELETE /albums/{invalidId}.
- Expected result: 404 Not Found (known deviation: service returns 200).

### POST /albums — malformed JSON
- Description: Server should reject syntactically invalid JSON bodies.
- Precondition: Prepare a set of malformed payloads (empty object, nullValues, wrongTypes, missingFields, raw invalid strings, incomplete JSON, null, undefined).
- Steps:
  1. For each payload, POST /albums with Content-Type: application/json.
- Expected result: 400 Bad Request; no resource created.

### POST /albums — invalid Content-Type
- Description: Reject requests with missing or incorrect Content-Type.
- Precondition: Valid JSON payload prepared.
- Steps:
  1. POST /albums with no Content-Type.
  2. POST /albums with Content-Type: text/plain.
- Expected result: 415 Unsupported Media Type in both cases.

### Unsupported methods
- Description: Endpoints should reject unsupported HTTP methods.
- Precondition: API reachable.
- Steps:
  1. Send HEAD /albums/1.
  2. Send OPTIONS /albums.
- Expected result: 405 Method Not Allowed for each unsupported method.

### POST /albums — extremely large payload
- Description: Oversized request bodies should be rejected.
- Precondition: Construct payload with title length 10,000 (or larger) chars.
- Steps:
  1. POST /albums with large payload.
- Expected result: 413 Payload Too Large.

### POST /albums — special characters in title
- Description: Requests containing invalid special characters should be rejected.
- Precondition: specialCharData = TestHelpers.generateInvalidData('album').specialCharacters.
- Steps:
  1. POST /albums with specialCharData.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

## Posts API

### GET /posts — retrieve all
- Description: Retrieve all posts and validate response.
- Precondition: API is available.
- Steps:
  1. GET /posts.
- Expected result: 200 OK; array of posts matching schema.

### GET /posts/{id} — non-existent
- Description: Request a non-existent post.
- Precondition: API is available.
- Steps:
  1. GET /posts/{nonExistentId}.
- Expected result: 404 Not Found.

### GET /posts/{id} — invalid ID format
- Description: Request a post with invalid ID format.
- Precondition: API is available.
- Steps:
  1. GET /posts/invalid-id.
- Expected result: 400 Bad Request.

### POST /posts — create with valid data
- Description: Create a post with valid data.
- Precondition: API is available.
- Steps:
  1. POST /posts with valid data.
- Expected result: 201 Created; response matches created post schema.

### POST /posts — create posts with valid data from external file
- Description: Create posts using valid data from an external file (data-driven).
- Precondition: API is available; validPosts data file present.
- Steps:
  1. For each post in validPosts, POST /posts with post data.
- Expected result: 201 Created; response matches created post schema and input data.

### POST /posts — handle invalid post data from external file
- Description: Attempt to create posts using invalid data from an external file (data-driven).
- Precondition: API is available; invalidPosts data file present.
- Steps:
  1. For each post in invalidPosts, POST /posts with invalid data.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

### POST /posts — create with invalid data
- Description: Attempt to create a post with invalid data.
- Precondition: API is available.
- Steps:
  1. POST /posts with invalid data.
- Expected result: 400 Bad Request.

### POST /posts — malformed JSON
- Description: Server should reject syntactically invalid JSON bodies.
- Precondition: Prepare malformed payloads (invalid string, incomplete JSON, null, undefined).
- Steps:
  1. For each payload, POST /posts with Content-Type: application/json.
- Expected result: 400 Bad Request; no resource created.

### POST /posts — invalid Content-Type headers
- Description: Reject requests with missing or incorrect Content-Type.
- Precondition: Valid JSON payload prepared.
- Steps:
  1. POST /posts with no Content-Type.
  2. POST /posts with Content-Type: text/plain.
- Expected result: 415 Unsupported Media Type in both cases.

### POST /posts — unsupported HTTP methods
- Description: Endpoints should reject unsupported HTTP methods (HEAD, OPTIONS).
- Precondition: API is available.
- Steps:
  1. Send HEAD /posts/1.
  2. Send OPTIONS /posts.
- Expected result: 405 Method Not Allowed for each unsupported method.

### POST /posts — extremely large payloads
- Description: Oversized request bodies should be rejected.
- Precondition: Construct payload with title length 10,000+ chars, body 50,000+ chars.
- Steps:
  1. POST /posts with large payload.
- Expected result: 413 Payload Too Large.

### POST /posts — special characters in data
- Description: Attempt to create a post with special characters.
- Precondition: API is available.
- Steps:
  1. POST /posts with special character data.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

### PATCH /posts/{id} — partial update with valid data
- Description: Partially update a post.
- Precondition: At least one post exists.
- Steps:
  1. PATCH /posts/{id} with valid partial data.
- Expected result: 200 OK; updated fields changed.

### PATCH /posts/{id} — non-existent
- Description: PATCH to a non-existent post.
- Precondition: API is available.
- Steps:
  1. PATCH /posts/{nonExistentId} with valid data.
- Expected result: 404 Not Found.

### PATCH /posts/{id} — invalid data
- Description: PATCH with invalid data.
- Precondition: At least one post exists.
- Steps:
  1. PATCH /posts/{id} with invalid data.
- Expected result: 400 Bad Request.

### DELETE /posts/{id} — delete existing
- Description: Delete an existing post.
- Precondition: At least one post exists.
- Steps:
  1. DELETE /posts/{id}.
- Expected result: 204 No Content.

### DELETE /posts/{id} — non-existent
- Description: Delete a non-existent post.
- Precondition: API is available.
- Steps:
  1. DELETE /posts/{nonExistentId}.
- Expected result: 404 Not Found.

## Users API

### GET /users — retrieve all
- Description: Retrieve all users and validate response schema and email format.
- Precondition: API is available.
- Steps:
  1. GET /users.
- Expected result: 200 OK; array of 10 users matching schema.

### GET /users/{id} — retrieve by ID
- Description: Retrieve a user by a valid ID and validate all fields.
- Precondition: API is available; userId in [1..10].
- Steps:
  1. GET /users/{userId}.
- Expected result: 200 OK; user object matches schema and requested id.

### GET /users?username={username} — retrieve by username
- Description: Retrieve user(s) by username query param.
- Precondition: API is available; valid username exists.
- Steps:
  1. GET /users?username={username}.
- Expected result: 200 OK; array with one user matching username.

### GET /users/{id} — non-existent
- Description: Request a user with a non-existent ID.
- Precondition: API is available.
- Steps:
  1. GET /users/{nonExistentId}.
- Expected result: 404 Not Found.

### GET /users/{id} — invalid ID format
- Description: Request a user with invalid ID format.
- Precondition: API is available.
- Steps:
  1. GET /users/invalid-id.
- Expected result: 400 Bad Request.

### POST /users — create users with valid data from external file
- Description: Create users using valid data from external file (data-driven).
- Precondition: API is available; validUsers data file present.
- Steps:
  1. For each user in validUsers, POST /users with user data.
- Expected result: 201 Created; response matches created user schema and input data.

### POST /users — handle invalid user data from external file
- Description: Attempt to create users using invalid data from external file (data-driven).
- Precondition: API is available; invalidUsers data file present.
- Steps:
  1. For each user in invalidUsers, POST /users with invalid data.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

### PUT /users/{id} — update existing
- Description: Update an existing user with valid data.
- Precondition: userId in [1..10]; valid updateData.
- Steps:
  1. PUT /users/{userId} with updateData.
- Expected result: 200 OK; response contains updated fields and id === userId.

### PUT /users/{id} — non-existent
- Description: Attempt to update a non-existent user.
- Precondition: invalidId = TestHelpers.getNonExistentId(); valid updateData.
- Steps:
  1. PUT /users/{invalidId} with updateData.
- Expected result: 404 Not Found.

### PATCH /users/{id} — partial update with valid data
- Description: Partially update an existing user with valid data.
- Precondition: userId in [1..10]; valid patchData.
- Steps:
  1. PATCH /users/{userId} with patchData.
- Expected result: 200 OK; response contains updated fields and id === userId.

### DELETE /users/{id} — delete existing
- Description: Delete an existing user.
- Precondition: userId in [1..10].
- Steps:
  1. DELETE /users/{userId}.
- Expected result: 204 No Content.

### DELETE /users/{id} — non-existent
- Description: Attempt to delete a non-existent user.
- Precondition: invalidId = TestHelpers.getNonExistentId().
- Steps:
  1. DELETE /users/{invalidId}.
- Expected result: 404 Not Found.

### GET /users/{id}/posts — retrieve posts for user
- Description: Retrieve all posts for a specific user.
- Precondition: userId in [1..10].
- Steps:
  1. GET /users/{userId}/posts.
- Expected result: 200 OK; array of posts with userId matching.

### GET /users/{id}/albums — retrieve albums for user
- Description: Retrieve all albums for a specific user.
- Precondition: userId in [1..10].
- Steps:
  1. GET /users/{userId}/albums.
- Expected result: 200 OK; array of albums with userId matching.

### GET /users/{id}/todos — retrieve todos for user
- Description: Retrieve all todos for a specific user.
- Precondition: userId in [1..10].
- Steps:
  1. GET /users/{userId}/todos.
- Expected result: 200 OK; array of todos with userId matching.

### POST /users — malformed JSON
- Description: Attempt to create a user with malformed JSON or invalid payloads.
- Precondition: API is available; malformed payloads prepared.
- Steps:
  1. For each payload, POST /users with Content-Type: application/json.
- Expected result: 400 Bad Request or client error.

### POST /users — invalid Content-Type headers
- Description: Attempt to create a user with missing or incorrect Content-Type.
- Precondition: API is available; valid JSON payload prepared.
- Steps:
  1. POST /users with no Content-Type.
  2. POST /users with Content-Type: text/plain.
- Expected result: 415 Unsupported Media Type in both cases.

### POST /users — unsupported HTTP methods
- Description: Attempt unsupported HTTP methods on users endpoints.
- Precondition: API is available.
- Steps:
  1. HEAD /users/1.
  2. OPTIONS /users.
- Expected result: 405 Method Not Allowed for each.

### POST /users — extremely large payloads
- Description: Attempt to create a user with extremely large payload.
- Precondition: API is available; large payload prepared.
- Steps:
  1. POST /users with large payload.
- Expected result: 413 Payload Too Large.

### POST /users — special characters in user data
- Description: Attempt to create a user with special characters in fields.
- Precondition: API is available; special character data prepared.
- Steps:
  1. POST /users with special character data.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

## Comments API

### GET /comments — retrieve all
- Description: Retrieve all comments and validate response schema.
- Precondition: API is available.
- Steps:
  1. GET /comments.
- Expected result: 200 OK; array of 500 comments matching schema.

### GET /posts/{id}/comments — retrieve comments for a specific post
- Description: Retrieve all comments for a specific post.
- Precondition: API is available; postId in [1..100].
- Steps:
  1. GET /posts/{postId}/comments.
- Expected result: 200 OK; array of comments with postId matching.

### GET /comments — validate email formats
- Description: Validate email format in a sample of comments.
- Precondition: API is available.
- Steps:
  1. GET /comments.
  2. Check email format in sample comments.
- Expected result: All sampled emails match standard email format.

### GET /comments?postId={postId} — retrieve comments by postId query parameter
- Description: Retrieve comments by postId using query parameter.
- Precondition: API is available; postId in [1..100].
- Steps:
  1. GET /comments?postId={postId}.
- Expected result: 200 OK; array of comments with postId matching.

### GET /comments/{id} — non-existent
- Description: Request a non-existent comment.
- Precondition: API is available.
- Steps:
  1. GET /comments/{nonExistentId}.
- Expected result: 404 Not Found.

### GET /comments/{id} — invalid ID format
- Description: Request a comment with invalid ID format.
- Precondition: API is available.
- Steps:
  1. GET /comments/invalid-id.
- Expected result: 400 Bad Request.

### POST /comments — create comment with valid data
- Description: Create a comment with valid data.
- Precondition: API is available.
- Steps:
  1. POST /comments with valid data.
- Expected result: 201 Created; response matches created comment schema.

### POST /comments — validate email format in comment data
- Description: Attempt to create comments with invalid email formats.
- Precondition: API is available; invalid email data prepared.
- Steps:
  1. For each invalid email, POST /comments with invalid email.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

### PUT /comments/{id} — update existing
- Description: Update an existing comment with valid data.
- Precondition: commentId in [1..500]; valid updateData.
- Steps:
  1. PUT /comments/{commentId} with updateData.
- Expected result: 200 OK; response contains updated fields and id === commentId.

### PUT /comments/{id} — non-existent
- Description: Attempt to update a non-existent comment.
- Precondition: invalidId = TestHelpers.getNonExistentId(); valid updateData.
- Steps:
  1. PUT /comments/{invalidId} with updateData.
- Expected result: 404 Not Found.

### PATCH /comments/{id} — partial update with valid data
- Description: Partially update an existing comment with valid data.
- Precondition: commentId in [1..500]; valid patchData.
- Steps:
  1. PATCH /comments/{commentId} with patchData.
- Expected result: 200 OK; response contains updated fields and id === commentId.

### DELETE /comments/{id} — delete existing
- Description: Delete an existing comment.
- Precondition: commentId in [1..500].
- Steps:
  1. DELETE /comments/{commentId}.
- Expected result: 204 No Content.

### DELETE /comments/{id} — non-existent
- Description: Attempt to delete a non-existent comment.
- Precondition: invalidId = TestHelpers.getNonExistentId().
- Steps:
  1. DELETE /comments/{invalidId}.
- Expected result: 404 Not Found.

### POST /comments — malformed JSON
- Description: Attempt to create a comment with malformed JSON or invalid payloads.
- Precondition: API is available; malformed payloads prepared.
- Steps:
  1. For each payload, POST /comments with Content-Type: application/json.
- Expected result: 400 Bad Request or client error.

### POST /comments — invalid Content-Type headers
- Description: Attempt to create a comment with missing or incorrect Content-Type.
- Precondition: API is available; valid JSON payload prepared.
- Steps:
  1. POST /comments with no Content-Type.
  2. POST /comments with Content-Type: text/plain.
- Expected result: 415 Unsupported Media Type in both cases.

### POST /comments — unsupported HTTP methods
- Description: Attempt unsupported HTTP methods on comments endpoints.
- Precondition: API is available.
- Steps:
  1. HEAD /comments/1.
  2. OPTIONS /comments.
- Expected result: 405 Method Not Allowed for each.

### POST /comments — extremely large payloads
- Description: Attempt to create a comment with extremely large payload.
- Precondition: API is available; large payload prepared.
- Steps:
  1. POST /comments with large payload.
- Expected result: 413 Payload Too Large.

### POST /comments — special characters in comment data
- Description: Attempt to create a comment with special characters in fields.
- Precondition: API is available; special character data prepared.
- Steps:
  1. POST /comments with special character data.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

## Photos API

### GET /photos — retrieve all
- Description: Retrieve all photos and validate response schema.
- Precondition: API is available.
- Steps:
  1. GET /photos.
- Expected result: 200 OK; array of 5000 photos matching schema.

### GET /photos/{id} — retrieve by ID
- Description: Retrieve a specific photo by ID and validate all fields.
- Precondition: API is available; photoId in [1..5000].
- Steps:
  1. GET /photos/{photoId}.
- Expected result: 200 OK; photo object matches schema and requested id.

### GET /albums/{id}/photos — retrieve photos for a specific album
- Description: Retrieve all photos for a specific album.
- Precondition: API is available; albumId in [1..100].
- Steps:
  1. GET /albums/{albumId}/photos.
- Expected result: 200 OK; array of photos with albumId matching.

### GET /photos?albumId={albumId} — retrieve photos by albumId query parameter
- Description: Retrieve photos by albumId using query parameter.
- Precondition: API is available; albumId in [1..100].
- Steps:
  1. GET /photos?albumId={albumId}.
- Expected result: 200 OK; array of photos with albumId matching.

### GET /photos/{id} — non-existent
- Description: Request a non-existent photo.
- Precondition: API is available.
- Steps:
  1. GET /photos/{nonExistentId}.
- Expected result: 404 Not Found.

### GET /photos/{id} — invalid ID format
- Description: Request a photo with invalid ID format.
- Precondition: API is available.
- Steps:
  1. GET /photos/invalid-id.
- Expected result: 400 Bad Request.

### POST /photos — create photo with valid data
- Description: Create a photo with valid data.
- Precondition: API is available.
- Steps:
  1. POST /photos with valid data.
- Expected result: 201 Created; response matches created photo schema.

### PUT /photos/{id} — update existing
- Description: Update an existing photo with valid data.
- Precondition: photoId in [1..5000]; valid updateData.
- Steps:
  1. PUT /photos/{photoId} with updateData.
- Expected result: 200 OK; response contains updated fields and id === photoId.

### PUT /photos/{id} — non-existent
- Description: Attempt to update a non-existent photo.
- Precondition: invalidId = TestHelpers.getNonExistentId(); valid updateData.
- Steps:
  1. PUT /photos/{invalidId} with updateData.
- Expected result: 404 Not Found.

### PATCH /photos/{id} — partial update with valid data
- Description: Partially update an existing photo with valid data.
- Precondition: photoId in [1..5000]; valid patchData.
- Steps:
  1. PATCH /photos/{photoId} with patchData.
- Expected result: 200 OK; response contains updated fields and id === photoId.

### DELETE /photos/{id} — delete existing
- Description: Delete an existing photo.
- Precondition: photoId in [1..5000].
- Steps:
  1. DELETE /photos/{photoId}.
- Expected result: 204 No Content.

### DELETE /photos/{id} — non-existent
- Description: Attempt to delete a non-existent photo.
- Precondition: invalidId = TestHelpers.getNonExistentId().
- Steps:
  1. DELETE /photos/{invalidId}.
- Expected result: 404 Not Found.

### POST /photos — malformed JSON
- Description: Attempt to create a photo with malformed JSON or invalid payloads.
- Precondition: API is available; malformed payloads prepared.
- Steps:
  1. For each payload, POST /photos with Content-Type: application/json.
- Expected result: 400 Bad Request or client error.

### POST /photos — invalid Content-Type headers
- Description: Attempt to create a photo with missing or incorrect Content-Type.
- Precondition: API is available; valid JSON payload prepared.
- Steps:
  1. POST /photos with no Content-Type.
  2. POST /photos with Content-Type: text/plain.
- Expected result: 415 Unsupported Media Type in both cases.

### POST /photos — unsupported HTTP methods
- Description: Attempt unsupported HTTP methods on photos endpoints.
- Precondition: API is available.
- Steps:
  1. HEAD /photos/1.
  2. OPTIONS /photos.
- Expected result: 405 Method Not Allowed for each.

### POST /photos — extremely large payloads
- Description: Attempt to create a photo with extremely large payload.
- Precondition: API is available; large payload prepared.
- Steps:
  1. POST /photos with large payload.
- Expected result: 413 Payload Too Large.

### POST /photos — special characters in photo data
- Description: Attempt to create a photo with special characters in fields.
- Precondition: API is available; special character data prepared.
- Steps:
  1. POST /photos with special character data.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

### POST /photos — validate URL formats in photo data
- Description: Attempt to create a photo with invalid URL formats.
- Precondition: API is available; invalid URL data prepared.
- Steps:
  1. For each invalid URL, POST /photos with invalid URL.
- Expected result: 400 Bad Request.

## Todos API

### GET /todos — retrieve all
- Description: Retrieve all todos and validate response schema.
- Precondition: API is available.
- Steps:
  1. GET /todos.
- Expected result: 200 OK; array of 200 todos matching schema.

### GET /todos/{id} — retrieve by ID
- Description: Retrieve a specific todo by ID and validate all fields.
- Precondition: API is available; todoId in [1..200].
- Steps:
  1. GET /todos/{todoId}.
- Expected result: 200 OK; todo object matches schema and requested id.

### GET /todos/{id} — non-existent
- Description: Request a non-existent todo.
- Precondition: API is available.
- Steps:
  1. GET /todos/{nonExistentId}.
- Expected result: 404 Not Found.

### GET /todos/{id} — invalid ID format
- Description: Request a todo with invalid ID format.
- Precondition: API is available.
- Steps:
  1. GET /todos/invalid-id.
- Expected result: 400 Bad Request.

### POST /todos — create todo with valid data
- Description: Create a todo with valid data.
- Precondition: API is available.
- Steps:
  1. POST /todos with valid data.
- Expected result: 201 Created; response matches created todo schema.

### PUT /todos/{id} — update existing
- Description: Update an existing todo with valid data.
- Precondition: todoId in [1..200]; valid updateData.
- Steps:
  1. PUT /todos/{todoId} with updateData.
- Expected result: 200 OK; response contains updated fields and id === todoId.

### PUT /todos/{id} — non-existent
- Description: Attempt to update a non-existent todo.
- Precondition: invalidId = TestHelpers.getNonExistentId(); valid updateData.
- Steps:
  1. PUT /todos/{invalidId} with updateData.
- Expected result: 404 Not Found.

### PATCH /todos/{id} — partial update with valid data
- Description: Partially update an existing todo with valid data.
- Precondition: todoId in [1..200]; valid patchData.
- Steps:
  1. PATCH /todos/{todoId} with patchData.
- Expected result: 200 OK; response contains updated fields and id === todoId.

### DELETE /todos/{id} — delete existing
- Description: Delete an existing todo.
- Precondition: todoId in [1..200].
- Steps:
  1. DELETE /todos/{todoId}.
- Expected result: 204 No Content.

### DELETE /todos/{id} — non-existent
- Description: Attempt to delete a non-existent todo.
- Precondition: invalidId = TestHelpers.getNonExistentId().
- Steps:
  1. DELETE /todos/{invalidId}.
- Expected result: 404 Not Found.

### POST /todos — special characters in todo data
- Description: Attempt to create a todo with special characters in fields.
- Precondition: API is available; special character data prepared.
- Steps:
  1. POST /todos with special character data.
- Expected result: 400 Bad Request or 422 Unprocessable Entity.

### POST /todos — extremely large payloads
- Description: Attempt to create a todo with extremely large payload.
- Precondition: API is available; large payload prepared.
- Steps:
  1. POST /todos with large payload.
- Expected result: 413 Payload Too Large.

### POST /todos — malformed JSON
- Description: Attempt to create a todo with malformed JSON or invalid payloads.
- Precondition: API is available; malformed payloads prepared.
- Steps:
  1. For each payload, POST /todos with Content-Type: application/json.
- Expected result: 400 Bad Request or client error.

### POST /todos — invalid Content-Type headers
- Description: Attempt to create a todo with missing or incorrect Content-Type.
- Precondition: API is available; valid JSON payload prepared.
- Steps:
  1. POST /todos with no Content-Type.
  2. POST /todos with Content-Type: text/plain.
- Expected result: 415 Unsupported Media Type in both cases.

### POST /todos — unsupported HTTP methods
- Description: Attempt unsupported HTTP methods on todos endpoints.
- Precondition: API is available.
- Steps:
  1. HEAD /todos/1.
  2. OPTIONS /todos.
- Expected result: 405 Method Not Allowed for each.