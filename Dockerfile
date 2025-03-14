# Use Node.js LTS as base image
FROM node:20-slim

# Create app directory in container
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install bash for startup script
RUN apt-get update && apt-get install -y bash

# Copy app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Default environment variables
ENV PORT=3000
ENV DB_HOST=mysql
ENV DB_USER=dbuser
ENV DB_PASSWORD=dbpassword
ENV STARTUP_DELAY=15

# CMD will be overridden by docker-compose
CMD ["node", "index.js"]