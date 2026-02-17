# Recipe Book Backend Documentation

## Architectural Foundation
*   **Framework**: NestJS (v11) with strictly typed Controllers, Services, and Modules.
*   **ORM**: Prisma (v5) connecting to a PostgreSQL (Supabase) database.
*   **Validation**: Global `ValidationPipe` using `class-validator` and `class-transformer` to enforce strict DTO shapes.
*   **Response Standards**: All write operations (POST/PUT/DELETE) are protected by RBAC; DELETE operations respond with **204 No Content**.

## Authentication & Security
*   **Strategy**: JWT-based authentication where the token is stored in an `httpOnly` cookie named `token`.
*   **RBAC (Role-Based Access Control)**: 
    *   Implemented `RolesGuard` and `@Roles()` decorator.
    *   Users are assigned `USER` or `ADMIN` roles. All data modification endpoints require `ADMIN`.
*   **Endpoints**:
    *   `POST /api/auth/admin/login`: Verifies credentials and sets the cookie.
    *   `GET /api/auth/admin/verify`: Returns current user metadata (`id`, `email`, `role`).
    *   `POST /api/auth/admin/logout`: Clears the session cookie.

## Core Features
### Recipes API (`/api/recipes`)
*   Supports full CRUD operations.
*   Fetch and Delete operations use SEO-friendly `slugs`.
*   Responses include nested `category` and `createdBy` (user) information.

### Categories API (`/api/categories`)
*   Manages recipe categories (e.g., "Breakfast", "Vegan").
*   Linked 1:N with Recipes.

### Image Management
*   Integrated Cloudinary for secure image uploads at `POST /api/images/upload`.
*   Handles file uploads via `Multer` and streams them directly to Cloudinary.

## Code Quality & Type Safety
*   **Strict Typing**: Zero `any` policy; uses explicit interfaces and Prisma-generated types.
*   **Centralized Types**: Shared `JwtPayload` and `AuthenticatedRequest` in `src/utils/types.ts`.
*   **Clean Workspace**: Legacy code removed; focused root structure.

## Setup Instructions
1.  **Environment Setup**: Update `.env` with `DATABASE_URL`, `JWT_SECRET`, and Cloudinary credentials.
2.  **Database Sync**: Run `npx prisma db push`.
3.  **Role Setup**: Manually promote target users to `ADMIN` in the database.
4.  **Run**: Execute `npm run start:dev` to begin development.
