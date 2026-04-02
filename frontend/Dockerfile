# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY package*.json ./
RUN npm install

COPY . .
# Defect 10: Run build for production
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app/frontend

COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/node_modules ./node_modules

EXPOSE 3000

# Run in production mode
CMD ["npm", "start"]
