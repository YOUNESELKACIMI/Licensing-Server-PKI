FROM node:alpine

WORKDIR /usr/enclave

COPY . .

RUN npm ci

CMD ["node","./enclave.js"]
