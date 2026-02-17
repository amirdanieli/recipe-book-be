# Recipe Book Backend API Documentation

This document lists every HTTP endpoint exposed by the backend, the expected request and response shapes, authentication and app configuration details useful for the front-end.

Base URL
- Default (development): `http://localhost:3000`

Authentication
- Type: JWT stored in an `httpOnly` cookie named `token`.
- Protected routes use `@UseGuards(AuthGuard('jwt'))` and additional role checks via `RolesGuard` + `@Roles()`.
- Roles: `ADMIN`, `USER`. All POST/PUT/PATCH/DELETE operations require `ADMIN`.
- The JWT cookie is set on login and cleared on logout. The server reads the token from `req.cookies.token`.
- Default JWT secret: the code falls back to `super_secure_secret_key_123` if `process.env.JWT_SECRET` is not provided.

Common headers / cookies
- Cookie: `token=<jwt>` (httpOnly)
- Content-Type: `application/json` for JSON bodies
- File uploads: `multipart/form-data` with file field `file`

Endpoints

**Auth**
- `POST /auth/admin/login`
  - Description: Admin login. Sets `token` cookie (httpOnly) on success.
  - Request body (application/json):
    ```json
    {
      "email": "admin@example.com",
      "password": "password123"
    }
    ```
  - Response (200):
    ```json
    {
      "token": "<jwt-token>",
      "user": {
        "id": "<user-id>",
        "email": "admin@example.com",
        "role": "ADMIN"
      }
    }
    ```

- `POST /auth/admin/logout`
  - Description: Clears the `token` cookie.
  - Request: no body required. The `token` cookie will be cleared regardless.
  - Response (200):
    ```json
    { "message": "Logout successful" }
    ```

- `GET /auth/admin/verify`
  - Description: Verify current JWT and return the authenticated user's info.
  - Auth: Requires valid `token` cookie (JWT).
  - Response (200):
    ```json
    { "user": { "id": "<user-id>", "email": "<email>", "role": "ADMIN" } }
    ```

**Recipes**
- `POST /recipes`
  - Description: Create a recipe (ADMIN only).
  - Auth: Requires `token` cookie and `ADMIN` role.
  - Request body (application/json): `CreateRecipeDto`
    ```json
    {
      "title": "Chocolate Cake",
      "description": "Rich and moist",
      "categoryId": "<category-id>",
      "difficulty": "EASY|MEDIUM|HARD",
      "prepTimeMinutes": 20,
      "prepTimeNote": "plus chilling",
      "cookTimeMinutes": 30,
      "servings": 8,
      "story": "Grandma's recipe",
      "ingredients": [
        { "name": "Flour", "quantity": "2", "unit": "cups" }
      ],
      "steps": [
        "Preheat oven",
        "Mix ingredients"
      ],
      "imageUrl": "https://..."
    }
    ```
  - Notes: `difficulty` enum is imported from Prisma's `Difficulty` type. Valid values depend on Prisma schema (check `prisma/schema.prisma`).

- `GET /recipes`
  - Description: List recipes. Optional query param `category` to filter by category slug or id.
  - Query params: `?category=<slug-or-id>`
  - Response (200): array of recipe objects (shape produced by service/prisma models).

- `GET /recipes/:slug`
  - Description: Get a recipe by SEO `slug`.
  - Response (200): single recipe object.

- `PUT /recipes/:slug`
  - Description: Update a recipe by slug (ADMIN only).
  - Auth: `token` cookie and `ADMIN` role required.
  - Request body: `UpdateRecipeDto` (partial of `CreateRecipeDto`).
  - Response (200): updated recipe object.

- `DELETE /recipes/:slug`
  - Description: Delete a recipe by slug (ADMIN only).
  - Auth: `token` cookie and `ADMIN` role required.
  - Response (204 No Content) on success.

**Categories**
- `POST /categories`
  - Description: Create a category (ADMIN only).
  - Auth: `token` cookie and `ADMIN` role required.
  - Request body (application/json):
    ```json
    { "name": "Desserts" }
    ```
  - Response (200): created category object.

- `GET /categories`
  - Description: List categories.
  - Response (200): array of category objects.

- `GET /categories/:idOrSlug`
  - Description: Get a category by id or slug.
  - Response (200): single category object.

- `PUT /categories/:id`
  - Description: Update a category by id (ADMIN only).
  - Auth: `token` cookie and `ADMIN` role required.
  - Request body: `UpdateCategoryDto` (partial of `CreateCategoryDto`).
  - Response (200): updated category object.

- `DELETE /categories/:id`
  - Description: Delete a category by id (ADMIN only).
  - Auth: `token` cookie and `ADMIN` role required.
  - Response (204 No Content) on success.

**Images**
- `POST /images/upload`
  - Description: Upload an image. Returns a hosted image URL from Cloudinary.
  - Auth: Requires `token` cookie (any authenticated user).
  - Request: `multipart/form-data` with field `file` containing the file.
  - Response (200):
    ```json
    { "url": "https://res.cloudinary.com/.../image.jpg" }
    ```

Notes on request/response typings
- DTOs are enforced with `class-validator` and `class-transformer`.
- `CreateRecipeDto` includes nested `ingredients` with `name`, `quantity`, `unit`.
- `Update*Dto` types extend `PartialType(...)` so all fields are optional for updates.

App configuration details for frontend
- Port: default NestJS port `3000` (check `main.ts` to confirm or `process.env.PORT`).
- CORS: not explicitly shown in controllers; check `main.ts` for any CORS/global settings. If missing, frontend should set `credentials: 'include'` when sending cookies and the server must enable CORS for credentials.
- Cookies: `token` cookie is httpOnly, `sameSite: 'lax'`, `secure` when `NODE_ENV==='production'`, `maxAge` 1 day.
- Cloudinary: Provider expects env vars `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Prisma/Postgres: Database connection is configured via Prisma; check `prisma/schema.prisma` and environment variables (e.g., `DATABASE_URL`).

Frontend integration tips
- Include credentials when calling protected endpoints so cookies are sent:
  - fetch: `fetch(url, { credentials: 'include', ... })`
  - axios: `axios.get(url, { withCredentials: true })`
- Login: call `POST /auth/admin/login` with JSON body; the server sets `token` cookie and also returns `token` and `user` in the response body.
- To check auth state: call `GET /auth/admin/verify`.
- Image upload: send `FormData` with `file` field to `/images/upload` and read returned `url` to store on recipe creation.

Where to look for more details
- DTOs and controllers in `src/recipes`, `src/categories`, `src/images`, and `src/auth`.
- JWT strategy in `src/auth/jwt.strategy.ts` shows cookie extraction and secret fallback.
- Cloudinary provider in `src/images/cloudinary.provider.ts`.
- Prisma service in `src/prisma/prisma.service.ts`.

If you want, I can:
- Add example cURL and axios snippets for each endpoint.
- Generate an OpenAPI (Swagger) spec from the NestJS app.

---
Generated on 2026-01-20.
