# Minimal Dockerfile - if main one fails
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Minimal install
RUN npm install 

# Copy everything
COPY . .

# Start
EXPOSE 3000

CMD ["npm", "run", "dev"]