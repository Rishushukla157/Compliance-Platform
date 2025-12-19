# Simple working Dockerfile
FROM node:18-alpine


WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Copy rest of the application
COPY . .

ENV NODE_ENV=development
ENV PORT=3001
EXPOSE 3001

CMD ["nodemon", "app.js"]
