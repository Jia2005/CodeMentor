# Use an official Node.js runtime as a parent image
FROM node:18-alpine
# Install Python and Pip
RUN apk add --no-cache python3 py3-pip
# Set the working directory in the container
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the backend source code
COPY . .
# Make port 3001 available to the world outside this container
EXPOSE 3001
# Define the command to run the app
CMD ["node", "server.js"]