FROM node:12

WORKDIR /app

# RUN apt-get update
# RUN apt-get install -y mosquitto

RUN npm -v

COPY package* ./
RUN npm install

COPY . .

RUN npm run tsc

CMD node dist/src/index.js
