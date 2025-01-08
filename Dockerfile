# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript
RUN npm install -g typescript
RUN tsc

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/app.js"]