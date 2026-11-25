# Backup da demonstracao

Coloque aqui `AgroVision.sql`, com estrutura **e dados** do banco `AgroVision`.
Esse arquivo e ignorado pelo Git. O Compose exige que ele exista.

Na raiz do repositorio, execute `bash scripts/exportar-banco.sh` no computador
que possui o MySQL original. O script solicita a senha sem grava-la no comando.

O MySQL importa o SQL somente quando o volume esta vazio. Reiniciar os containers
ou substituir o arquivo nao reaplica o backup. Consulte `docs/entrega-docker.md`.
