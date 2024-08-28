# Base Environment
FROM node:16.0.0-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other source code files
COPY . .

# ENV variables
ENV NODE_ENV production
ENV PORT 80
ENV MONGODB_URI "mongodb+srv://doadmin:T28U165y4X7jrYa3@db-mongodb-sgp1-84819-bbff5d9b.mongo.ondigitalocean.com/admin"
ENV SECRET_KEY 74944dca-1521-4229-8b83-3d4c5283c123

# Expose port
EXPOSE 80

CMD ["npm", "start"]
