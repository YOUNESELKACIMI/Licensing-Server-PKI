FROM node:alpine

WORKDIR /usr/clientOperations

COPY . .

RUN npm ci

EXPOSE 8081

CMD ["node", "./clientOperations.js"]