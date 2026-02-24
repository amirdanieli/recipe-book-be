ARG NODE_IMAGE=node:20-alpine

# Stage 1: Build (includes dev deps)
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

# Prisma schema requires DATABASE_URL to exist during `prisma generate`.
# This value is only used at build time; runtime DATABASE_URL comes from the deployment env.
ARG DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/postgres
ENV DATABASE_URL=$DATABASE_URL

ARG NPM_CONFIG_STRICT_SSL=true
ENV NPM_CONFIG_STRICT_SSL=$NPM_CONFIG_STRICT_SSL

COPY package.json ./
COPY prisma ./prisma/

# Avoid running postinstall (which calls `prisma generate`) during install.
# Use `npm install` because this repo does not include a package-lock.json.
RUN npm install --ignore-scripts

COPY nest-cli.json tsconfig*.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Keep only production dependencies for the runtime image
RUN npm prune --omit=dev


# Stage 2: Runtime (production)
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER node

EXPOSE 3000
CMD ["sh", "docker-entrypoint.sh"]