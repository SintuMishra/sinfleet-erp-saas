FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
RUN npm install --workspace backend

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY package.json ./
COPY backend ./backend
WORKDIR /app/backend
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/src/generated ./src/generated
COPY --from=build /app/backend/node_modules ./node_modules
EXPOSE 5001
CMD ["npm", "run", "start"]
