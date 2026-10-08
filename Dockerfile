FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install deps first (leverage Docker cache)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
