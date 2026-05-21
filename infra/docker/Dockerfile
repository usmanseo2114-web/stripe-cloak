# Use Node.js 20-alpine as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm (optional, but we can use npm or yarn)
# We'll use npm for simplicity
# If you prefer pnpm, you can install it here

# Copy package files
COPY package*.json ./
COPY packages/central-hub/package*.json ./packages/central-hub/
COPY packages/sdk/package*.json ./packages/sdk/

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build --workspace=packages/central-hub

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start", "--workspace=packages/central-hub"]