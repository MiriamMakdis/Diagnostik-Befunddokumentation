FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable

COPY src ./src

EXPOSE 4000

CMD ["yarn", "dev"]