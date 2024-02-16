FROM node:12

WORKDIR /app

COPY test.js /app
# RUN npm ci
CMD node test.js

