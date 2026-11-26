#!/bin/sh
set -eu

MAPBOX_ACCESS_TOKEN="${MAPBOX_ACCESS_TOKEN:-}"
MAPTILER_API_KEY="${MAPTILER_API_KEY:-}"
export MAPBOX_ACCESS_TOKEN MAPTILER_API_KEY

# Chaves publicas de navegador: valide antes de gerar JavaScript com envsubst.
for value in "$MAPBOX_ACCESS_TOKEN" "$MAPTILER_API_KEY"; do
  case "$value" in
    *[!a-zA-Z0-9._-]*)
      echo 'Chave de mapa invalida: use somente letras, numeros, ponto, _ e -.' >&2
      exit 1
      ;;
  esac
done

envsubst '${MAPBOX_ACCESS_TOKEN} ${MAPTILER_API_KEY}' \
  < /opt/agrovision/runtime-config.js.template \
  > /usr/share/nginx/html/runtime-config.js
