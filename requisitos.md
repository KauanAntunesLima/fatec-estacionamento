Grupo composto por:

Kauan Antunes
Vitor Henrique
Rodrigo Oliveira
Jonathas Soares

Definição do Projeto

Problema:


Muitos estacionamentos de pequeno e médio porte (ou condomínios/comércios) ainda utilizam processos manuais em papel ou planilhas desconectadas para gerenciar a entrada e saída de veículos. Isso causa lentidão no atendimento, filas na entrada, dificuldade para calcular o tempo de permanência com precisão, risco de perda de controle de vagas disponíveis e falta de relatórios financeiros confiáveis.

Objetivo:

Desenvolver um sistema de controle de estacionamento ágil e intuitivo que automatize o registro de entrada e saída de veículos, calcule automaticamente o valor da permanência com base em regras de cobrança por hora, controle a lotação em tempo real e gere um fechamento de caixa diário simples e seguro.

Usuários do Sistema:

Operador / Manobrista (Atendente):  Acompanha o sistema cadastrando o veiculo, imprime ou envia o ticket, recebe o pagamento e libera a saída.

Administrador / Dono do Estacionamento: Visualiza relatórios de faturamento diário/mensal, configura valores por hora/diária, e monitora a ocupação das vagas.

Cliente (Motorista): Recebe o comprovante de estacionamento e faz o pagamento de forma rápida através do totem de auto atendimento.

Pesquisa com o Cliente (Entrevista de Requisitos)
Para entender melhor as dores reais de quem opera um estacionamento, elaboramos 5 perguntas estratégicas e simulamos as respostas recebidas por um operador/dono de estacionamento.

Perguntas e Respostas:
1. Qual é a sua maior dificuldade ou dor de cabeça no dia a dia ao controlar as vagas e o fluxo de carros?

Resposta: "O momento de pico (muitos carros chegando ao mesmo tempo) gera fila. Se eu demorar muito preenchendo o bloquinho de papel com a placa e o horário."

2. Qual é a capacidade do estacionamento?

Resposta: A capacidade é 50 vagas.

3. Você sofre com problemas de controle de caixa ou sumiço de dinheiro no final do expediente?

Resposta: "Sim, como tudo é anotado em um caderno, às vezes o troco não bate ou o funcionário esquece de anotar uma saída, gerando diferença no fechamento do caixa à noite."

4. O sistema precisa controlar mensalistas (clientes fixos) ou apenas rotativos (avulsos)?

Resposta: "Precisa dos dois! Uns 30% dos meus clientes são mensalistas que deixam o carro todo dia. O sistema precisa reconhecer a placa deles e liberar a catraca/entrada sem cobrar na hora."

5. Você tem dificuldade com clientes saindo sem pagar?

Resposta: "Sim, as vezes pela super lotação ao mesmo tempo alguns clientes passam sem pagar."

Regra de negocio:

• Capacidade de 50 vagas 
• não aceitar placa vazia 
• não duplicar placa ativa 
• liberar vaga na saída.


Requisitos funcionais:

RF01 Registrar entrada 
RF02 Registrar saída
RF03 Mostrar vagas livres
RF04 Pagamento atráves do auto-atendimento.
RF05 Exibir veículos ativos

Requisitos não funcionais:

RNF01: O tempo de resposta para registrar a entrada (RF01) ou a saída (RF02) de um veículo não deve ultrapassar 2 segundos, mesmo em horários de pico.

RNF02: A consulta e atualização da contagem de vagas livres (RF03) e a listagem de veículos ativos (RF05) devem ser exibidas em tempo real. (tempo de atualização inferior a 1 segundo após qualquer alteração).

RNF03: A interface das telas de autoatendimento (RF04) deve ser intuitiva, com botões grandes e fontes de fácil leitura, permitindo que qualquer motorista conclua o pagamento em até 1 minuto sem ajuda externa.

RNF04: O sistema deve possuir alto contraste ou suporte a modo claro/escuro para facilitar a visualização em guaritas com luz solar direta ou ambientes externos.

RNF05: O sistema deve operar com disponibilidade de 99,9%, evitando quedas que possam travar a entrada ou a saída de veículos e causar filas.

RNF06: Em caso de queda de energia ou falha na internet, o sistema deve possuir um mecanismo de salvamento automático local (offline-first) para não perder os registros de horários (RF06) e dados dos veículos já estacionados.

RNF07: Os dados de pagamento processados nos terminais de autoatendimento (RF04) devem seguir estritamente as normas de segurança do padrão PCI-DSS para proteção de cartões de crédito/débito.

RNF08: O acesso às funções administrativas do sistema deve ser restrito por login e senha (com controle de perfis), impedindo que operadores alterem configurações de preços ou relatórios financeiros indevidamente.
RNF09: O sistema deve ser compatível com os principais navegadores web do mercado (Google Chrome, Mozilla Firefox, Microsoft Edge) e adaptável (responsivo) para computadores de guarita e tablets.

