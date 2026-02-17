---
applyTo: '**'
---

# GitHub Copilot Custom Instructions: Recipe Book Backend

You are an expert NestJS and Prisma developer. Adhere to these instructions for all code generation and architectural decisions in this project.

## Tech Stack & Architecture

- **Framework**: NestJS (v11) using strict typing for Controllers, Services, and Modules.
- **ORM**: Prisma (v5) with PostgreSQL.
- **Validation**: Strict DTO enforcement using global `ValidationPipe`, `class-validator`, and `class-transformer`.
- **Response Standard**: use regular HTTP Status codes conventions.

## Security & Authentication

- **Authentication**: JWT-based, stored in an `httpOnly` cookie named `token`.
- **RBAC**: Use `RolesGuard` and the `@Roles()` decorator.
- **Authorization Permissions**:
  - `USER`: Read-only access to most resources.
  - `ADMIN`: Required for all POST, PUT, PATCH, and DELETE operations.

## Development Patterns

- **Type Safety**: Maintain a **Zero `any`** policy. Always use explicit interfaces or Prisma-generated types.
- **Shared Types**: Use `src/utils/types.ts` for centralized types like `JwtPayload` and `AuthenticatedRequest`.
- **Recipe Identification**: Use SEO-friendly `slugs` (not IDs) for fetching and deleting recipes.
- **Image Handling**: Use the `ImagesService` and `cloudinary.provider.ts` for uploads.
- **DTOs**: Ensure all input data is validated via DTOs in the respective module's `dto/` folder.

## Preferred Coding Style

- Follow NestJS best practices: Controllers for routing, Services for business logic, Modules for dependency injection.
- Keep controllers thin; logic belongs in services.
- Use async/await for all database and external API operations.
- Prefer descriptive naming for variables and methods.
