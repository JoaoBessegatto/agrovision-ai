# ---------- build ----------
# Angular 22 exige Node ^22.22.3 || ^24.15.0
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Chaves de mapa (opcionais). O código-fonte as tem como strings vazias.
ARG MAPTILER_API_KEY=""
ARG MAPBOX_ACCESS_TOKEN=""
RUN printf "export const MAPTILER_API_KEY = '%s';\n" "$MAPTILER_API_KEY" > src/app/core/config/maptiler.config.ts \
 && printf "export const MAPBOX_ACCESS_TOKEN = '%s';\n" "$MAPBOX_ACCESS_TOKEN" > src/app/core/config/mapbox.config.ts

# O build de produção do projeto estoura os "budgets" do angular.json
# (bundle inicial > 1MB e vários .scss > 8kB) e falha. Removemos só os
# budgets aqui na imagem, sem alterar o seu angular.json.
RUN node -e "const fs=require('fs');\
const j=JSON.parse(fs.readFileSync('angular.json'));\
delete j.projects['agrovision-web'].architect.build.configurations.production.budgets;\
fs.writeFileSync('angular.json',JSON.stringify(j,null,2));"

RUN npx ng build --configuration production

# ---------- runtime ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/agrovision-web/browser /usr/share/nginx/html
EXPOSE 80
