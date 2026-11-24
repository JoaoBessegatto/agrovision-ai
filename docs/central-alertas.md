# Central de alertas ativos

A rota `/app/alertas` acompanha os animais **ativos da fazenda selecionada**. A tela consulta `GET /api/alertas/fazenda/{fazendaId}` ao abrir, a cada 60 segundos enquanto estiver visível, ao voltar à aba do navegador e pelo botão Atualizar. A saída da tela ou troca de fazenda cancela a consulta anterior. Não há processo agendado em segundo plano, histórico permanente, notificações externas nem estado de leitura.

O backend reaproveita as regras de desempenho; a central e os detalhes do animal usam a mesma fonte. Cada consulta recalcula as ocorrências. Novas pesagens aparecem na próxima atualização, e a mensagem desaparece quando sua condição deixa de existir. Um animal pode ter mais de um alerta, por exemplo perda de peso e pesagem atrasada.

| Gravidade na tela | Condição | Parâmetro atual |
| --- | --- | --- |
| Grave | Peso diminuiu entre as duas últimas pesagens com intervalo positivo | Qualquer variação negativa |
| Médio | GMD não negativo abaixo da referência | Menos de 0,50 kg/dia |
| Médio | Tempo desde a última pesagem atingiu o limite | 45 dias ou mais |
| Informativo | Não há duas pesagens recentes com intervalo válido para calcular GMD | Menos de duas pesagens, ou as duas últimas no mesmo instante |

GMD = diferença de peso / intervalo em dias (calculado a partir dos segundos). Os limites são avaliados **antes do arredondamento**. A referência de 0,50 kg/dia é configuração operacional, não um valor ideal universal para qualquer animal ou manejo. As mensagens orientam conferir os registros; não realizam diagnóstico.

Configuração já existente em `Back-end/src/main/resources/application.properties`:

```properties
app.desempenho.gmd-minimo-alerta=0.50
app.desempenho.dias-sem-pesagem-alerta=45
```

Não há alteração de tabelas ou migração do banco. O endpoint exige autenticação e passa por `FazendaAccessService.exigirVisualizacao`, que verifica propriedade, perfil administrativo ou vínculo ativo com permissão.

## Uso e validação

- Menu lateral **Alertas**, com contagens por gravidade, busca por animal/rebanho/mensagem e filtros por gravidade e rebanho.
- Cada mensagem abre o histórico do animal. A página Desempenho também oferece acesso à lista completa.
- Falhas de rede exibem aviso e mantêm os últimos dados identificados como possivelmente desatualizados. Respostas 401/403 removem os dados exibidos.
- Um retorno vazio é diferenciado de erro de consulta e de fazenda sem animais ativos.

No backend, com JDK 21 instalado, execute na pasta `Back-end`:

```sh
bash mvnw -Dtest=DesempenhoAlertasTest,GeometriaRuralServiceTest test
```

No frontend, após `npm ci`, execute na pasta `Front-end/agrovision-web`:

```sh
npm run test:alertas
npm run build -- --configuration development
```

A suíte de alertas isola sua configuração TypeScript porque a suíte geral contém imports antigos inválidos. Os testes cobrem os limites do cálculo, perda pequena, intervalo inválido, atraso, exclusão de inativos, bloqueio de acesso, filtros, troca de fazenda, atualização sem sobreposição, pausa da aba oculta e recuperação de erro. Uma validação integrada com MySQL e contas reais continua necessária antes da apresentação.

## Revisão para fechamento do TCC

Base analisada: `main` em `091db68a9936cfb3f4badcf9c4680cf1bdef873a`.

1. **Build de produção:** reproduzida também na base sem esta funcionalidade. O pacote inicial excede o limite de 1 MB em 1,22 kB; dez folhas de estilo de componentes excedem o limite de 8 kB. A mudança adiciona aproximadamente 1,3 kB ao pacote inicial. Reduzir duplicação de estilos e carregamento inicial antes de publicar; os limites existentes não foram aumentados para ocultar a falha.
2. **Suíte geral Angular:** há imports inválidos nos testes de interceptor JWT, autenticação, cadastro, dashboard e login. Atualizar esses testes para os nomes e dependências atuais antes de usá-los como verificação geral do projeto.
3. **Preparação para hospedagem:** as URLs `http://localhost:8080` estão repetidas nos serviços Angular, inclusive no padrão seguido pelo novo serviço. Centralizar a URL da API por ambiente antes de hospedar.
4. **Documentação:** descrever alertas como regras sobre pesagens e parâmetros configurados. Não afirmar uso de inteligência artificial, histórico de alertas ou processamento contínuo quando o aplicativo estiver fechado.

Roteiro integrado recomendado: registrar perda, registrar ganho abaixo da referência, registrar ganho acima dela, conferir o desaparecimento da ocorrência, trocar de fazenda e verificar acesso com produtor e funcionário autorizado.
