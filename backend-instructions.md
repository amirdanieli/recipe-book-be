# Backend Implementation Plan: Recipe Book API

## Tech Stack
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Storage**: Cloudinary (for images)
- **Authentication**: JWT (HttpOnly Cookies)
- **Hosting**: Render (Backend), Vercel (Frontend)

## 1. Project Initialization
Initialize the NestJS project in the root's `backend` folder.
```bash
npm i -g @nestjs/cli
nest new backend
cd backend
npm install @prisma/client prisma @nestjs/config @nestjs/passport passport passport-jwt @nestjs/jwt cookie-parser class-validator class-transformer cloudinary streamifier
npm install -D @types/passport-jwt @types/cookie-parser @types/multer
npx prisma init
```

## 2. Environment Variables (.env)
Required variables for the backend:

```env
# App
PORT=5000
FRONTEND_URL=http://localhost:5173 # Update to Vercel URL in production

# Database (Supabase Connection String)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Auth
JWT_SECRET=super_secure_secret_key_123

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## 3. Database Schema (prisma/schema.prisma)
The schema matches the Frontend interfaces.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id       String @id @default(uuid())
  email    String @unique
  password String // Hashed
  name     String?
}

model Recipe {
  id              String   @id @default(uuid())
  title           String
  slug            String   @unique
  categoryId      String
  difficulty      String
  prepTimeMinutes Int
  cookTimeMinutes Int
  story           String?
  ingredients     Json     // Stores array of { name, quantity, unit }
  steps           String[]
  imageUrl        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 4. API Endpoints Specification
Global Prefix: `/api`

### Auth Module (/api/auth)
- **POST /login**
  - Body: `{ "email": "...", "password": "..." }`
  - Action: Validate credentials. Generate JWT.
  - Response: 200 OK + Set HttpOnly Cookie named `token`.
- **POST /logout**
  - Action: Clear token cookie.
  - Response: 200 OK.
- **GET /verify** (Guarded)
  - Action: Check if JWT in cookie is valid.
  - Response: `{ "user": { "id": "...", "email": "..." } }`

### Recipe Module (/api/recipes)
- **GET /**
  - Query Params: `?category=c-lunch` (Optional filters)
  - Response: `Recipe[]`
- **GET /:slug**
  - Response: `Recipe`
- **POST /** (Guarded)
  - Body: `CreateRecipeDto` (Matches `recipeData` in FE)
  - Response: Created `Recipe`
- **PUT /:slug** (Guarded)
  - Body: `UpdateRecipeDto`
  - Response: Updated `Recipe`
- **DELETE /:id** (Guarded)
  - Response: 200 OK

### Images Module (/api/images)
- **POST /upload** (Guarded)
  - Body: `multipart/form-data` (File)
  - Action: Upload to Cloudinary.
  - Response: `{ "url": "https://res.cloudinary.com/..." }`

## 5. Main Configuration (main.ts)
Critical for CORS and Cookies to work with the frontend.

```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  
  app.enableCors({
    origin: process.env.FRONTEND_URL, // e.g., 'http://localhost:5173'
    credentials: true, // REQUIRED for cookies
  });

  await app.listen(process.env.PORT || 5000);
}
```

## 6. Deployment Notes
- **Backend (Render)**:
  - Build Command: `npm run build`
  - Start Command: `npm run start:prod`
  - Env Vars: Set `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`.
- **Frontend (Vercel)**:
  - Ensure calls point to the Render URL (e.g., `https://my-api.onrender.com`).
