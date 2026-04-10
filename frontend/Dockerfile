# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY package*.json ./
RUN npm install

COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Defect 10: Run build for production

RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Standalone mode only needs these files
COPY --from=builder /app/frontend/.next/standalone/frontend ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

# Next.js standalone server
CMD ["node", "server.js"]

