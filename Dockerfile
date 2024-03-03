FROM node:18

WORKDIR /app

EXPOSE 1983

# PIC Programmer
RUN mkdir /tmp/picpgm_install
RUN wget http://picpgm.picprojects.net/download/picpgm-2.9.3.1-linux-armhf.tar.gz -O /tmp/picpgm_install/picpgm.tar.gz
RUN tar xzvf /tmp/picpgm_install/picpgm.tar.gz -C /tmp/picpgm_install
RUN cp -f /tmp/picpgm_install/picpgm .
COPY setup/pgmifcfg.xml .
RUN rm -rf /tmp/picpgm_install

# Setup
RUN npm config set update-notifier false
COPY package.json ./
COPY package-lock.json ./
RUN npm i --no-fund --no-audit --skip-dev --maxsockets 1

COPY src src
COPY tsconfig.json .
COPY tsconfig.service-menu.json .
COPY angular.json .
COPY tsconfig.app.json .
RUN npm run tsc

# Service menu
RUN npx ng build
RUN mv dist/service-menu servicemenu

RUN rm -rf src tsconfig.json tsconfig.service-menu.json angular.json tsconfig.app.json package-lock.json

# PICS
RUN wget https://github.com/mopopinball/pics/releases/latest/download/dist.tar.gz -O pics.tar.gz
RUN mkdir -p pics/installed
RUN mkdir -p pics/available
RUN tar xf pics.tar.gz -C pics/available --strip-components=4
RUN rm pics.tar.gz

# Data (typically bind mounted to host)
RUN mkdir data

# Run the engine
CMD node -r source-map-support/register dist/src/index.js
