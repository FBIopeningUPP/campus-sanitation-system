# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p uploads database

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "backend/server.js"]
