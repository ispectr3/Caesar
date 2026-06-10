# 🎭 Project: CAESAR (Caesar OSINT)

[![License: MIT](https://img.shields.io/badge/License-MIT-crimson.svg)](https://opensource.org/licenses/MIT)
[![Stack: React + TanStack Start](https://img.shields.io/badge/Stack-React%20%2B%20TanStack-black.svg?style=flat&logo=react)](https://tanstack.com/)
[![Aesthetic: Cyberpunk / Tactical](https://img.shields.io/badge/Aesthetic-Tactical%20%2F%20Hacker-6D001A.svg)]()

**Caesar OSINT** é uma plataforma de inteligência de fontes abertas (OSINT) e reconhecimento digital. O projeto foi projetado com uma estética tática hacker militar, utilizando tipografia totalmente monoespaçada, cantos vivos (`rounded-none`), inputs com prompts interativos (`$ `) e um esquema de cores focado em Preto e Borgonha (`#6D001A`).

> [!NOTE]
> **Garantia de Privacidade:** Nenhuma consulta realizada através da plataforma é armazenada, registrada ou compartilhada. Todas as requisições externas são feitas pelo servidor para que a sua origem (IP cliente) nunca seja exposta.

---

## 🛠️ Módulos Integrados

A plataforma conta com **14 módulos de reconhecimento** ativos e acessíveis diretamente da página inicial:

1. 🌐 **IP Lookup** – Informações de geolocalização, ISP, ASN e organização para qualquer IPv4/IPv6.
2. 🗄️ **WHOIS** – Consulta de dados cadastrais, data de criação, expiração e servidores DNS via protocolo RDAP.
3. 🧬 **DNS Lookup** – Resolução em tempo real de registros (A, AAAA, MX, NS, TXT, CNAME, SOA) via Google DNS-over-HTTPS.
4. 🔍 **Username Search** – Verificação instantânea de presença de nome de usuário em mais de 10 plataformas e redes sociais.
5. ✉️ **Email Validator** – Análise sintática de e-mail, consulta de registros MX ativos e verificação contra domínios descartáveis.
6. 🛡️ **HTTP Headers** – Verificador e pontuador de cabeçalhos de segurança HTTP com feedback de proteção.
7. 🔑 **Hash Identifier** – Análise criptográfica local de padrões de hashes comuns (MD5, SHA1, SHA256, bcrypt, etc.).
8. 🕸️ **Subdomain Scanner** – Enumeração passiva de subdomínios através de registros públicos de transparência de certificados (crt.sh).
9. 🔎 **Google Dorks** – Gerador interativo de filtros avançados do Google para auditoria de arquivos confidenciais e diretórios abertos.
10. ⚠️ **CVE Search** – Consulta de vulnerabilidades conhecidas por produto ou ID diretamente na base de dados do NIST NVD.
11. 🏢 **CNPJ Lookup** – Detalhes cadastrais de empresas brasileiras, sócios e capital social integrado via BrasilAPI.
12. 📍 **GEOINT** – Geocodificação reversa de endereços e coordenadas usando a base do OpenStreetMap (Nominatim).
13. 📞 **Phone OSINT** – Extração de operadora, fuso horário, validade e metadados de números de telefone globais.
14. 🚨 **Scam Analyzer** – Analisador heurístico local contra tentativas de golpes, phishing e engenharia social.

---

## 🔗 Repositórios e APIs Utilizados

Para viabilizar as consultas e o funcionamento dos módulos de OSINT, o projeto utiliza os seguintes repositórios e serviços de código aberto:

### Módulos e Integrações de API:
- **BrasilAPI** ([GitHub](https://github.com/BrasilAPI/BrasilAPI)) - Utilizado para consultas de CNPJ, bancos, informações de DDD e CEP.
- **Minha Receita** ([GitHub](https://github.com/lucas-c/minha-receita)) - API de fallback utilizada para busca de CNPJ.
- **OpenStreetMap Nominatim** ([GitHub](https://github.com/osm-search/Nominatim)) - Mecanismo de geocodificação utilizado na ferramenta de GEOINT.
- **libphonenumber-js** ([GitHub](https://github.com/catamphetamine/libphonenumber-js)) - Biblioteca para validação, parseamento e formatação de números de telefone globais no Phone OSINT.
- **NVD API** ([NIST NVD](https://nvd.nist.gov/developers/v2)) - Banco de dados de CVEs utilizado no buscador de vulnerabilidades.
- **RDAP Client / RDAP.org** ([RDAP Specification](https://www.rdap.org/)) - Utilizado para a ferramenta de busca descentralizada de WHOIS.
- **Google Public DNS** ([Google DNS](https://developers.google.com/speed/public-dns/docs/doh)) - API de DNS-over-HTTPS utilizada para a ferramenta de DNS Lookup.
- **IP-API** ([IP-API Documentation](https://ip-api.com/)) - Banco de geolocalização IP utilizado no módulo IP Lookup.

### Base da Aplicação e Design:
- **TanStack Start & Router** ([GitHub](https://github.com/tanstack/router)) — Framework principal de roteamento e SSR em React.
- **Lucide Icons** ([GitHub](https://github.com/lucide/lucide)) — Conjunto de ícones vetoriais modernos.
- **Tailwind CSS** ([GitHub](https://github.com/tailwindlabs/tailwindcss)) — Motor de estilização visual.
- **Vite** ([GitHub](https://github.com/vitejs/vite)) — Build tool de alta performance.

---

## 🎨 Identidade Visual e Design

- **Esquema de Cores:** Fundo preto absoluto (`oklch(0 0 0)`), textos brancos contrastantes e detalhes reflexivos em vermelho Borgonha (`oklch(0.42 0.17 18)` ou `#6D001A`).
- **Layout Rígido:** Cantos retos em todos os inputs, botões, modais e cartões (`rounded-none`).
- **Tipografia:** Uso global e estrito de fontes monoespaçadas (JetBrains Mono).
- **Interface Tática:** Caixa de inputs simulando prompts de terminal (`$ input`), botões representados por blocos de ação e efeito sutil de overlay CRT.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18 ou superior) ou [Bun](https://bun.sh/) instalado.

### 1. Clonar o repositório
```bash
git clone https://github.com/ispectr3/Caesar.git
cd Caesar
```

### 2. Instalar as dependências
```bash
# Com npm
npm install

# Ou com Bun
bun install
```

### 3. Rodar em modo de desenvolvimento
```bash
# Com npm
npm run dev

# Ou com Bun
bun dev
```
O servidor de desenvolvimento iniciará em `http://localhost:3000` (ou similar).

### 4. Build de produção
Para compilar a aplicação otimizada para produção:
```bash
# Com npm
npm run build
npm run preview
```

---

## 🧰 Arsenal OSINT Recomendado (CLI & Standalone)

Para investigações avançadas em terminal local (CLI) ou análises mais profundas e ofensivas, sugerimos integrar a sua rotina com as seguintes ferramentas de referência:

- **GHunt** ([GitHub](https://github.com/mxrch/GHunt)) - Especializado no mapeamento do ecossistema e contas de serviços Google.
- **Sherlock** ([GitHub](https://github.com/sherlock-project/sherlock)) - Caçador extremamente rápido de usernames em mais de 400 redes sociais.
- **SocialScan** ([GitHub](https://github.com/iojw/socialscan)) - Verificador de e-mails e nomes de usuário focado na prevenção de falsos positivos.
- **TheHarvester** ([GitHub](https://github.com/laramies/theHarvester)) - Coleta de e-mails, subdomínios, IPs e funcionários via fontes públicas.
- **PhoneInfoga** ([GitHub](https://github.com/sundowndev/phoneinfoga)) - Mapeamento e análise aprofundada de números de telefone e operadoras.
- **Mosint** ([GitHub](https://github.com/alpkeskin/mosint)) - Canivete suíço escrito em Go para validação e reconhecimento completo de e-mails.
- **MailSleuth** ([GitHub](https://github.com/44za12/mailsleuth)) - Checador concorrente para detecção de e-mails em dezenas de serviços populares.
- **LeakLooker** ([GitHub](https://github.com/woj-ciech/LeakLooker)) - Detector de bancos de dados expostos publicamente via Shodan.
- **Spiderfoot** ([GitHub](https://github.com/smicallef/spiderfoot)) - Plataforma de automação OSINT agregando mais de 200 fontes de dados.
- **GitFive** ([GitHub](https://github.com/mxrch/GitFive)) - Rastreador de perfis de desenvolvedores e commits no GitHub.

## 📚 Guias e Metodologias OSINT

- **Awesome OSINT** ([GitHub](https://github.com/jivoi/awesome-osint)) - O maior diretório mantido pela comunidade contendo listas de ferramentas e sites recomendados.
- **OSINT-BIBLE** ([GitHub](https://github.com/frangelbarrera/OSINT-BIBLE)) - Manual metodológico detalhado para conduzir investigações e relatórios de inteligência.

---

## ⚖️ Aviso Legal / Termos de Uso

> [!WARNING]
> Esta ferramenta deve ser utilizada estritamente para propósitos de segurança defensiva, pesquisa ética, jornalismo investigativo, educação ou verificação autorizada de dados próprios. Qualquer atividade maliciosa envolvendo doxxing, stalking, engenharia social ou violação das leis de privacidade locais é estritamente proibida e de inteira responsabilidade do usuário operador.
