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
ENV MONGODB_URI "mongodb+srv://kenktent:<Short@aa>@kenblitz.gka5p.mongodb.net/"
ENV SECRET_KEY 74944dca-1521-4229-8b83-3d4c5283c123

# Expose port
EXPOSE 80

CMD ["npm", "start"]
