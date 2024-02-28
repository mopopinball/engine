FROM node:18

WORKDIR /app

EXPOSE 1983

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
RUN mkdir servicemenu
RUN cp -r dist/service-menu/* servicemenu

# PICS
RUN wget https://github.com/mopopinball/pics/releases/latest/download/dist.tar.gz -O pics.tar.gz
RUN mkdir -p pics/installed
RUN mkdir -p pics/available
RUN tar xf pics.tar.gz -C pics/available --strip-components=4
RUN rm pics.tar.gz

# Data (typically bind mounted to host)
RUN mkdir data

# Run the engine
CMD node dist/src/index.js
