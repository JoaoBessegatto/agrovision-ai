#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

dump_file=docker/mysql-init/01-agrovision.sql
test -s "$dump_file" || { echo 'Backup SQL ausente ou vazio.' >&2; exit 1; }

# Impede que a aplicacao escreva durante a verificacao/importacao.
docker compose stop backend frontend
docker compose up -d --wait mysql

mysql_cmd() {
  docker compose exec -T mysql sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot --batch --skip-column-names "$MYSQL_DATABASE"'
}

# Conta registros em TODAS as tabelas, sem exibir seus dados.
rows="$(mysql_cmd <<'SQL'
SET SESSION group_concat_max_len=1000000;
SELECT GROUP_CONCAT(CONCAT('SELECT COUNT(*) AS n FROM `', REPLACE(TABLE_NAME, '`', '``'), '`') SEPARATOR ' UNION ALL ')
INTO @tables FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_type='BASE TABLE';
SET @query=IF(@tables IS NULL, 'SELECT 0', CONCAT('SELECT SUM(n) FROM (', @tables, ') AS existing_rows'));
PREPARE check_rows FROM @query;
EXECUTE check_rows;
DEALLOCATE PREPARE check_rows;
SQL
)"
case "$rows" in
  0) ;;
  *)
    echo 'Importacao cancelada: o banco ja contem registros ou nao foi possivel conferir.' >&2
    echo 'Nenhum dado foi substituido. Para voltar: docker compose up -d --wait' >&2
    exit 1
    ;;
esac

mysql_cmd < "$dump_file"
docker compose up -d --wait backend frontend
echo 'Backup importado no banco vazio. Sistema iniciado.'
