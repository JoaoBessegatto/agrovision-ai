# AgroVision AI

Plataforma de acompanhamento de pecuaria de corte, com Angular, Java/Spring Boot
e MySQL.

## Executar a demonstracao com Docker

1. Instale Docker com o plugin Compose (Docker Desktop no Windows/macOS).
2. Coloque o backup completo em `docker/mysql/seed/AgroVision.sql`.
3. Copie `.env.example` para `.env` e preencha as chaves publicas dos mapas.
4. Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

- Sistema: http://localhost:4200
- E-mails de teste (Mailpit): http://localhost:8025

O banco e importado automaticamente **na primeira inicializacao do volume**.
As contas e os dados sao os do backup. O SQL e o `.env` nao sao publicados no Git.
Quem baixar somente o repositorio ainda precisa receber o SQL separadamente.

Leia o [guia completo de entrega](docs/entrega-docker.md), incluindo exportacao,
Windows, atualizacao, persistencia, requisitos de internet e verificacao.
