# Use the official Node.js 16 LTS base image from the Docker Hub
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json (if available)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of your application's code
COPY . .

# The command to run your application
CMD ["node", "index.js"]
