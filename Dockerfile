FROM node:18
RUN apt-get update

WORKDIR /app

# Mosquitto
RUN apt-get install -y mosquitto
COPY setup/mosquitto.conf /etc/mosquitto/conf.d/myconfig.conf
RUN mosquitto -d

# Mopo Engine
COPY package* ./
RUN npm ci --no-fund --no-audit
COPY . .
RUN npm run tsc

# Service menu
RUN wget https://github.com/mopopinball/service-menu/releases/latest/download/dist.tar.gz -O menu.tar.gz
RUN mkdir servicemenu
RUN tar xf menu.tar.gz -C servicemenu --strip-components=2

# Run the engine
CMD node dist/src/index.js
