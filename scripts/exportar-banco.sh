#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
destination="$project_dir/docker/mysql/seed/AgroVision.sql"
mysql_user="${1:-root}"

command -v mysqldump >/dev/null || {
  echo 'mysqldump nao encontrado. Execute no computador com o MySQL original.' >&2
  exit 1
}
mkdir -p -- "$(dirname -- "$destination")"
umask 077
temporary_dump="$(mktemp "${destination}.XXXXXX")"
trap 'rm -f -- "$temporary_dump"' EXIT

echo 'Exportando estrutura e dados do banco AgroVision local.'
echo 'Informe a senha do MySQL original quando solicitado.'
mysqldump --user="$mysql_user" --password \
  --single-transaction --quick --hex-blob --no-tablespaces \
  --set-gtid-purged=OFF --column-statistics=0 \
  --default-character-set=utf8mb4 \
  --databases AgroVision --result-file="$temporary_dump"

test -s "$temporary_dump"
mv -- "$temporary_dump" "$destination"
echo "Backup salvo em: $destination"
echo 'Inclua esse arquivo no pacote privado de entrega. Ele nao sera enviado pelo Git.'
