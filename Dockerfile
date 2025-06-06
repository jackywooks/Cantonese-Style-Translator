# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (if you have one)
# to leverage Docker cache for dependencies
COPY package.json ./
# If you have package-lock.json, uncomment the next line if it exists
# COPY package-lock.json ./

RUN npm install

# Copy the rest of your application code
COPY . .

# IMPORTANT:
# Define a build argument for the VITE_API_KEY.
# This value will be passed during the `docker build` process (e.g., by Cloud Build).
ARG VITE_API_KEY_BUILD

# Set the build argument as an environment variable within this build stage.
# Vite will pick up environment variables prefixed with VITE_ during 'npm run build'.
ENV VITE_API_KEY=$VITE_API_KEY_BUILD

# Build the React app for production
# This command outputs static files to the 'dist' folder (default for Vite)
RUN npm run build


# Stage 2: Serve the static files with a lightweight web server (e.g., Nginx)
FROM nginx:alpine

# Copy the built React app files from the builder stage into Nginx's static file directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy a custom Nginx configuration if you have one.
# If you don't have one, Nginx's default config is usually fine for serving static files.
# For example, if you had a custom nginx.conf in your project root:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default for HTTP traffic)
# Cloud Run will map its default external port (8080) to this internal container port.
EXPOSE 80

# The default Nginx CMD will run Nginx and serve your files
CMD ["nginx", "-g", "daemon off;"]