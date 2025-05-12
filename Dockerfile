FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Create the final image
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies
RUN npm ci --omit=dev

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"] 