FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/package.json
RUN npm install --workspace frontend

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY package.json ./
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production
COPY --from=build /app/frontend/package.json ./package.json
COPY --from=build /app/frontend/.next ./.next
COPY --from=build /app/frontend/public ./public
COPY --from=build /app/frontend/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
