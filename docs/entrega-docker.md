# Entrega do AgroVision com Docker

Este ambiente foi preparado para execucao local pela banca e pela dupla. Sao
quatro servicos: `frontend` (Angular/Nginx), `backend` (Spring Boot/Java 21),
`mysql` e `mailpit`. Os enderecos publicados ficam restritos a `127.0.0.1`.

## 1. Exportar os dados atuais

No computador que possui o banco original, abra a **raiz do repositorio** e rode:

```bash
bash scripts/exportar-banco.sh
```

O script usa o usuario `root`, solicita sua senha e salva
`docker/mysql/seed/AgroVision.sql`. Para outro usuario:

```bash
bash scripts/exportar-banco.sh meu_usuario
```

O backup contem estrutura, registros e relacionamentos. `--hex-blob` preserva
os UUIDs binarios e os valores espaciais. `--single-transaction` faz uma leitura
consistente das tabelas InnoDB; nao altere a estrutura do banco durante o dump.
O script nao modifica o banco original e so substitui o arquivo anterior quando
a exportacao termina com sucesso. Nao use um dump com `--no-data`.

Alternativa pelo terminal (Linux ou PowerShell com mysqldump no PATH), na raiz:

```text
mysqldump -u root -p --single-transaction --quick --hex-blob --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --default-character-set=utf8mb4 --databases AgroVision --result-file=docker/mysql/seed/AgroVision.sql
```

No Windows, `--result-file` evita alteracoes de codificacao que podem ocorrer ao
redirecionar a saida com `>` em algumas versoes do PowerShell.

O arquivo `AgroVision_estrutura.sql` disponibilizado em 23/11/2026 possui somente
as tabelas; nao substitui o backup completo. A configuracao utiliza MySQL 8.0.46,
versao indicada naquele arquivo. Se o servidor original mudou, confira a
compatibilidade antes de importar.

## 2. Configuracao e mapas

Linux/macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

As credenciais de demonstracao do MySQL no Docker sao independentes da senha
do MySQL instalado no seu computador. Nao e preciso copiar sua senha original.
As contas de acesso ao AgroVision e seus hashes de senha, por outro lado, sao
restaurados do SQL: o login sera feito com uma conta que ja exista nesse backup.

Para os mapas, configure `MAPBOX_ACCESS_TOKEN` e `MAPTILER_API_KEY` no `.env`.
Use apenas chaves publicas destinadas ao navegador e autorize o endereco local
nas restricoes do provedor. Elas ficam incorporadas ao JavaScript compilado;
nao coloque tokens secretos de servidor nesses campos. As configuracoes de
mapas vazias da `main` nao permitem uma demonstracao completa dos mapas.
Depois de mudar essas chaves, reconstrua o frontend com `docker compose up --build -d`.

O Angular usa Node 24.22.3 no build, de acordo com os requisitos do lockfile.
A configuracao `docker` compila a interface otimizada com a API em `/api`;
o Nginx encaminha essas requisicoes ao Spring. O desenvolvimento com `ng serve`
mantem a API em `http://localhost:8080/api`.

## 3. Iniciar

Com Docker em execucao, na raiz do repositorio:

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Abra:

| Servico | Endereco |
| --- | --- |
| AgroVision | http://localhost:4200 |
| Mailpit | http://localhost:8025 |

O SQL deve existir antes da primeira execucao. O Compose nao cria um arquivo
vazio no lugar dele. O backend aguarda o MySQL estar pronto por TCP, depois
da importacao. O frontend aguarda o backend responder.

O Spring usa `ddl-auto=validate` nesse ambiente: confere o esquema importado
sem altera-lo automaticamente. Uma divergencia deve ser corrigida usando um
backup correspondente a versao de codigo entregue; os logs indicam a causa.

MySQL e API nao publicam portas no computador; nao conflitam com o MySQL local.
Se 4200 ou 8025 estiverem ocupadas, altere `APP_PORT` ou `MAILPIT_PORT` no `.env`.
Os links dos novos convites acompanham `APP_PORT`. Convites antigos podem estar
expirados ou conter links de outro ambiente; gere um novo convite para testar.
O Mailpit recebe e-mails somente neste ambiente, sem envio para caixas reais.

## 4. Persistencia e manutencao

```bash
# Parar sem apagar os dados
docker compose down

# Voltar a executar, preservando o banco
docker compose up -d

# Ver o andamento e eventuais erros
docker compose logs --tail=100 mysql backend frontend

# Acompanhar novos logs; Ctrl+C encerra somente a visualizacao
docker compose logs -f backend
```

Os volumes `mysql_data` e `mailpit_data` preservam os dados e e-mails.
Substituir o SQL e reiniciar **nao** importa novamente o arquivo: a inicializacao
do MySQL so executa os scripts quando o diretorio de dados esta vazio.

Para testar outro backup sem apagar a demonstracao atual, pare a instancia
atual e use um nome de projeto diferente:

```bash
docker compose down
docker compose -p agrovision-validacao up --build -d
```

Esse nome cria volumes independentes. Para encerra-lo preservando seus dados,
use `docker compose -p agrovision-validacao down`. Use `-p` em todos os comandos
relativos a essa instancia. Se uma importacao falhar, confira os logs e corrija
o SQL antes de testar novamente com outro nome de projeto e volumes novos.

Nao use `docker compose down -v` para uma parada comum: a opcao `-v` apaga os
volumes e elimina as alteracoes feitas na copia do banco.

## 5. Pacote para a banca e para Roberta

Entregue uma pasta/ZIP com:

- O codigo-fonte completo de uma versao identificada do repositorio.
- Os Dockerfiles, `compose.yaml`, scripts e este guia.
- `docker/mysql/seed/AgroVision.sql`, incluido manualmente no pacote privado.
- O `.env` de demonstracao, com configuracoes adequadas ao computador destino.
- As instrucoes de login de uma conta destinada a demonstracao, compartilhadas
  separadamente com os destinatarios.

Exclua `.git`, `node_modules`, `target`, `dist` e arquivos da IDE do pacote.
O `.gitignore` mantem SQLs e `.env` fora dos commits; `git archive` tambem nao
inclui esses arquivos ignorados. Lembre de inclui-los na copia privada.
O dump inclui dados pessoais e hashes das contas existentes. Revise o conjunto
antes de entregar; use contas/dados de demonstracao se houver dados pessoais
reais. Nao publique o dump no repositorio publico nem em uma imagem publica.

Cada computador recebe uma copia independente: alteracoes nao sao sincronizadas
entre a banca, Joao Pedro e Roberta. Datas das pesagens sao preservadas, portanto
indicadores relativos a hoje e alertas por tempo sem pesagem podem mudar.

## 6. Validacao antes de entregar

Em uma segunda maquina ou num projeto Compose com volumes novos:

1. Confirme que o SQL completo esta presente e o Docker/Compose funciona.
2. Execute o build e confira os quatro servicos com `docker compose ps`.
3. Entre com a conta do backup e confira fazendas, rebanhos, animais e pesagens.
4. Confira dashboard, desempenho, alertas e limites/piquetes no mapa.
5. Gere um convite e abra o e-mail no Mailpit.
6. Cadastre uma pesagem, pare e inicie o Compose, e confirme sua persistencia.
7. Recarregue uma rota interna no navegador para conferir o fallback do Angular.

Internet e necessaria no primeiro build para imagens, Maven e npm. Os mapas,
imagens de satelite, geocodificacao e fontes externas continuam dependendo dos
respectivos provedores mesmo depois do build. Este pacote nao promete operacao
totalmente offline. Docker deve estar instalado e habilitado na maquina destino;
no Windows, a configuracao usual usa containers Linux com WSL 2.

Referencias: [inicializacao do MySQL](https://hub.docker.com/_/mysql) e
[ordem de inicializacao no Compose](https://docs.docker.com/compose/how-tos/startup-order/).
