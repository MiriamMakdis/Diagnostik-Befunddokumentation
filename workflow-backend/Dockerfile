FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable

COPY src ./src
COPY server.js ./server.js
COPY test-data ./test-data

EXPOSE 3000

CMD ["yarn", "dev"]