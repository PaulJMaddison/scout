FROM node:22-alpine AS build
WORKDIR /app

COPY apps/web/package*.json ./
RUN npm ci

COPY apps/web/ ./

ARG VITE_API_BASE_URL=
ARG VITE_GRAPHQL_ENDPOINT=/graphql
ARG VITE_DEMO_FALLBACK=false

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_GRAPHQL_ENDPOINT=${VITE_GRAPHQL_ENDPOINT}
ENV VITE_DEMO_FALLBACK=${VITE_DEMO_FALLBACK}

RUN npm run build

FROM nginx:1.29-alpine AS final
WORKDIR /usr/share/nginx/html

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist ./

EXPOSE 8080
