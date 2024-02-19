FROM node:18
RUN apt-get update

WORKDIR /app

EXPOSE 1983

# Mopo Engine
RUN npm config set update-notifier false
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --no-fund --no-audit
COPY src src
COPY tsconfig.json .
RUN npm run tsc

# Service menu
RUN wget https://github.com/mopopinball/service-menu/releases/latest/download/dist.tar.gz -O menu.tar.gz
RUN mkdir servicemenu
RUN tar xf menu.tar.gz -C servicemenu --strip-components=2
RUN rm menu.tar.gz

# PICS
RUN wget https://github.com/mopopinball/pics/releases/latest/download/dist.tar.gz -O pics.tar.gz
RUN mkdir -p pics/installed
RUN mkdir -p pics/available
RUN tar xf pics.tar.gz -C pics/available --strip-components=4
RUN rm pics.tar.gz

# Run the engine
CMD node dist/src/index.js
