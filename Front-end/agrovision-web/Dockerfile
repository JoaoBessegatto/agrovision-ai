FROM node:24.22.3-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG MAPBOX_ACCESS_TOKEN=""
ARG MAPTILER_API_KEY=""
RUN node docker/configure-maps.mjs
RUN npm run build -- --configuration docker

FROM nginx:1.28-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/agrovision-web/browser /usr/share/nginx/html
EXPOSE 80
