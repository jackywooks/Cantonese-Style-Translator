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

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app files from the builder stage into Nginx's static file directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (Nginx default for HTTP traffic)
EXPOSE 80

# The default Nginx CMD will run Nginx and serve your files
CMD ["nginx", "-g", "daemon off;"]