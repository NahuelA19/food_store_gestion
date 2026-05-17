FROM node:20-alpine

ENV NODE_ENV=development

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy source (overridden by volume mount in docker-compose)
COPY . .

EXPOSE 5173

# Vite dev server — --host exposes to Docker network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
