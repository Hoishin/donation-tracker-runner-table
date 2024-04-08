FROM node:20-slim AS base

WORKDIR /app


FROM base AS build

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.ts tsconfig.json ./
COPY app app
COPY sample sample

RUN npm run build


FROM base AS node_modules

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM base AS release

COPY --from=node_modules /app/package.json ./
COPY --from=node_modules /app/node_modules node_modules
COPY --from=build /app/build build

CMD ["npm", "start"]
