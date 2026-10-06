#1. Picking the Docker image
FROM node:24-bookworm-slim

#2 Set the Env to production. This is useful if we want to skip heavy computing prod specific configurations
ENV NODE_ENV=development

#3 Set the current working directory. /app sets the cwd to directly inside the directory where this docker file is
WORKDIR /app

#4. Caches the dependencies Only changed if a new package.json is present
COPY package*.json ./

#5. Install the dependencies. We can sepaarte packages too using node cli but we'll keep it simple for now
RUN npm install

#6. Copy the rest of the application code to the container
COPY . .

#7. Switch to a non-root user for security
#User node

#8 Expose the port the app listens on
EXPOSE 3000

#8 Command to run the application
CMD ["npm", "start"]


#Build the Image  
#docker build -t my-node-app .

#Run the Container    // In package.json, make sure to include a "start" script otherwise youll see a failure   ex:
#docker run -p 3000:3000 my-node-app