FROM node:12

WORKDIR /app

RUN apt-get update
RUN apt-get install -y mosquitto

COPY package* ./
RUN npm ci

COPY . .

RUN npm run tsc

CMD node dist/src/index.js
