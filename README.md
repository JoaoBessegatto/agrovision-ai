# AgroVision AI — execução com Docker

Na raiz do repositório, com Docker e Docker Compose instalados:

```bash
docker compose up --build -d --wait
```

| Serviço | Acesso |
| --- | --- |
| Angular | http://localhost:4200 |
| API Java | http://localhost:4200/api (encaminhada pelo Nginx) |
| Mailpit | http://localhost:8025 |
| MySQL, para DBeaver | localhost:3307 |

Java, Maven, Node, Angular, MySQL e Mailpit são instalados/executados pelas
imagens. A máquina que abre a aplicação precisa apenas do Docker e do navegador.
O JavaScript do Angular é servido pelo Nginx e executado no navegador.

## Banco com os dados existentes

`docker/mysql-init/01-agrovision.sql` contém o backup já incluído nesta branch.
Sua extensão foi corrigida de `.sq` para `.sql`, sem alterar o conteúdo. A
imagem MySQL importa esse arquivo **na primeira inicialização de um volume vazio**.
Use as contas e senhas da aplicação que já existiam no banco original.

O volume `mysql_data` preserva alterações entre reinicializações. A versão 8.4
do MySQL foi mantida para compatibilidade com volumes já criados nesta branch.

Se você já iniciou a versão anterior e o sistema abriu sem dados, o MySQL pode
ter criado um volume antes de a extensão ser corrigida. Não apague o volume.
No Linux/macOS, este comando importa o backup **somente se todas as tabelas
estiverem sem registros**:

```bash
bash scripts/importar-banco-vazio.sh
```

O script pausa o back-end e o front-end para conferir o banco. Se encontrar
qualquer registro, cancela a importação e não substitui os dados. Nesse caso,
volte a iniciar com `docker compose up -d --wait` e confira qual cópia deseja usar.
Uma falha de importação também mantém a aplicação parada para diagnóstico.

Outra opção, inclusive no Windows, é criar uma **cópia independente**, preservando
o volume atual:

```bash
docker compose down
docker compose -p agrovision-demo up --build -d --wait
```

Continue usando `-p agrovision-demo` para os comandos dessa cópia. Não use `down -v`
para uma parada comum: a opção apaga volumes e todas as alterações feitas neles.

## Configurações e mapas

Use `.env.example` como referência. Se não existir `.env`, copie o exemplo:

```bash
cp .env.example .env
```

No PowerShell: `Copy-Item .env.example .env`. Preserve configurações locais já
preenchidas. `DB_PASSWORD` precisa corresponder à senha usada quando o volume
MySQL foi criado; mudar a variável não altera a senha de um volume existente.

Preencha no `.env` as chaves **públicas de navegador** `MAPBOX_ACCESS_TOKEN` e
`MAPTILER_API_KEY`. Elas são entregues ao navegador e devem ter as permissões e
origens adequadas ao uso local. Não use tokens secretos de servidor.

Depois de mudar as chaves, basta recriar o front-end, sem recompilar a imagem:

```bash
docker compose up -d --force-recreate frontend
```

O arquivo `/runtime-config.js` é gerado na inicialização, carregado antes do
Angular e servido sem cache. Chaves vazias permitem iniciar os demais módulos,
mas não disponibilizam os mapas dos provedores. Mapas, imagens de satélite,
geocodificação e fontes externas exigem internet; Docker não substitui esses serviços.

As portas podem ser ajustadas por `APP_PORT`, `MAILPIT_PORT` e `MYSQL_PORT`.
Se alterar a porta da interface, ajuste também `APP_FRONTEND_URL`, usada nos
links de convite. O SMTP do back-end aponta para `mailpit:1025`, dentro do Compose.

## Funcionamento e diagnóstico

```bash
docker compose ps
docker compose logs --tail=100 mysql backend frontend mailpit
docker compose down
docker compose up -d --wait
```

O MySQL só fica saudável após finalizar a importação. O Java aguarda MySQL e
Mailpit, e o Nginx aguarda a saúde da aplicação Java. O endpoint interno
`/actuator/health` verifica a aplicação sem expor detalhes de infraestrutura.

A API não ocupa a porta 8080 do computador: o Nginx encaminha `/api` para
`backend:8080`. Os serviços publicados usam apenas `127.0.0.1`. Os nomes dos
containers são gerados pelo Compose, evitando conflito com o antigo container
isolado `agrovision-mailpit`. Se houver outro projeto usando 4200, 8025 ou 3307,
pare esse projeto ou altere as portas no `.env`.

Para desenvolvimento fora do Docker, `ng serve` continua chamando a API em
`http://localhost:8080/api`. A configuração de build `docker` troca essa base por
`/api`, sem substituições improvisadas no JavaScript compilado.

## Teste integrado

O workflow `Docker Compose` executa os quatro serviços em uma máquina temporária
do GitHub Actions nos pushes para `feat/docker-compose`. Ele confere o backup,
as rotas do Angular, a API autenticada, cadastro/login, fazenda, convite SMTP e
persistência após recriar os containers. Os dados usados nesse teste são da
cópia temporária; não há acesso ao banco do computador do desenvolvedor.

Opcionalmente, com Python 3 instalado, execute apenas as verificações HTTP:

```bash
python3 scripts/smoke-docker.py
```

A opção `--write-test-data` também cria conta, produtor, fazenda e convite de
teste. Use-a somente em uma cópia de teste. Ela não é necessária para iniciar
ou utilizar a aplicação.

## Entrega

Entregue o código desta branch, o backup SQL e as configurações da demonstração
juntos. Cada computador terá uma cópia independente dos dados. O primeiro build
precisa de internet para baixar imagens e dependências.

O backup existente inclui os usuários do sistema e seus hashes de senha. Evite
distribuir dados pessoais reais além dos destinatários da demonstração; novos
backups e credenciais particulares não devem ser publicados no GitHub.
