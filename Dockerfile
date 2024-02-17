FROM node:12

WORKDIR /app

RUN apt update
RUN apt install -y mosquitto

COPY package* ./
RUN npm ci

COPY . .

npm run tsc

CMD node dist/src/index.js
