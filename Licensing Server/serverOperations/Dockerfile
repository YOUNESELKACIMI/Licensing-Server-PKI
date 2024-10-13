FROM node:alpine

WORKDIR /usr/serverOperations

COPY . .


RUN npm ci

EXPOSE 50051

CMD ["node","./serverOperations.js"]