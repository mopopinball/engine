FROM node:18
RUN apt-get update

WORKDIR /app

# RUN apt-get install -y apt-transport-https && apt-get -y update

RUN apt-get install -y mosquitto
COPY setup/mosquitto.conf /etc/mosquitto/conf.d/myconfig.conf

COPY package* ./
RUN npm ci --omit=dev

COPY . .

RUN npm run tsc

CMD node dist/src/index.js
