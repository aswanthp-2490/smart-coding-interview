FROM node:18

# Install build-essential for g++ and other build tools
RUN apt-get update && apt-get install -y build-essential

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Ensure the temp directory exists for code execution
RUN mkdir -p temp

EXPOSE 10000

CMD ["node", "server.js"]
