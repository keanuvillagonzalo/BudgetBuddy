
# --- Stage 1: Build the frontend ---
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

#Pass the VITE_CLERK_PUBLISHABLE_KEY argument to the build stage. This will be passed from Docker Compose filei want
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build the frontend
RUN npm run build


# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled Vite files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html


# Add proxy_pass for the backend container. This routes traffic with /api/ to the backend service
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:3000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


#docker build -t budget-frontend .
#docker run -p 8080:80 budget-frontend