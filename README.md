# 🎭 Project: CAESAR (Caesar OSINT)

[![License: MIT](https://img.shields.io/badge/License-MIT-crimson.svg)](https://opensource.org/licenses/MIT)
[![Stack: React + TanStack Start](https://img.shields.io/badge/Stack-React%20%2B%20TanStack-black.svg?style=flat&logo=react)](https://tanstack.com/)
[![Aesthetic: Cyberpunk / Tactical](https://img.shields.io/badge/Aesthetic-Tactical%20%2F%20Hacker-6D001A.svg)]()

**Caesar OSINT** é uma plataforma de inteligência de fontes abertas (OSINT) e reconhecimento digital. O projeto foi projetado com uma estética tática hacker militar, utilizando tipografia totalmente monoespaçada, cantos vivos (`rounded-none`), inputs com prompts interativos (`$ `) e um esquema de cores focado em Preto e Borgonha (`#6D001A`).


---

## 🛠️ Módulos Integrados

A plataforma conta com **50 módulos de reconhecimento** ativos e acessíveis diretamente da página inicial:

1. 👤 **CPF Search** – Validador, análise regional e rastreio de vazamento de CPF na Dark Web.
2. 🏢 **CNPJ Lookup** – Consultas cadastrais e quadro societário de empresas (BrasilAPI).
3. 📍 **CEP Address** – Busca de endereço físico e coordenadas por CEP (BrasilAPI).
4. 📍 **GEOINT** – OpenStreetMap Geocoding e coordenadas.
5. 📞 **Phone OSINT** – Extração de dados globais de números telefônicos.
6. 🎛️ **NAMINT Combiner** – Gerador passivo de variações de e-mail e usernames por nome do alvo.
7. 🔍 **WhatsMyName** – Verificação passiva de nome de usuário em múltiplas plataformas.
8. 🌐 **IP Lookup** – Geolocalização, ISP, ASN e organização por endereço IP.
9. 🗄️ **WHOIS** – Registrar, datas de criação/expiração e nameservers via RDAP.
10. 🧬 **DNS Lookup** – Registros A, AAAA, MX, NS, TXT, CNAME e SOA.
11. 🕸️ **Subdomain Scanner** – Descobre subdomínios via Certificate Transparency.
12. 🗃️ **LeakLooker** – Varre a internet pública em busca de portas abertas e bancos expostos.
13. 🚨 **AbuseIPDB Scanner** – Consulta a reputação de um IP e histórico de denúncias maliciosas.
14. 🚨 **Web Port Scanner** – Escaneamento ativo de portas focadas na superfície de ataque web.
15. 🛡️ **HTTP Headers** – Analisa headers de segurança com score de proteção.
16. ⚠️ **CVE Search** – Busca vulnerabilidades no banco de dados NIST NVD.
17. 📄 **File Phish** – Busca estruturada de documentos sensíveis expostos via Google Dorks.
18. 🛡️ **Certificados SSL (crt.sh)** – Consulta logs de Certificate Transparency para subdomínios.
19. 🔎 **Google Dorks** – Gerador de queries avançadas para encontrar arquivos e páginas ocultas.
20. 🐙 **GitFive** – Rastreia e-mails reais de commits públicos e identidades de desenvolvedores.
21. 🚨 **GHunt** – Identifica contas Google, GAIA IDs e exposição em serviços públicos.
22. ✉️ **Mosint** – Canivete suíço para investigação de e-mails e contas sociais.
23. 🚨 **Scam Analyzer** – Análise heurística de mensagens para identificação de golpes.
24. ✉️ **Email Validator** – Verifica formato, domínio MX e se é email descartável.
25. 🔑 **Hash Identifier** – Identifica tipo de hash: MD5, SHA1, SHA256, bcrypt e mais.
26. 🖼️ **EXIF Extractor** – Extrai metadados EXIF ocultos de imagens, incluindo GPS, modelo de câmera e data.
27. 🚨 **HIBP Breach Check** – Verifique se seu e-mail ou senhas vazaram em brechas de segurança públicas.
28. 🗄️ **Registro.br WHOIS** – Consulte proprietários, documentos associados (CNPJ/CPF) e DNS de domínios nacionais .br.
29. ⚖️ **CNJ DataJud** – Consulte processos judiciais em tribunais nacionais usando a numeração única do CNJ.
30. 🎛️ **Encoder / Decoder** – Codificador e decodificador multi-formato: Base64, URL, Hex, HTML e Binário.
31. 🎛️ **Regex Extractor** – Extraia CPFs, CNPJs, e-mails, IPs, telefones e URLs de dumps de texto.
32. ⏱️ **Timestamp Converter** – Converta Epoch Unix Timestamps para datas legíveis e vice-versa.
33. 🌐 **Favicon Hash** – Obtenha MurmurHash3 de favicon para buscas de infraestrutura no Shodan.
34. 🖼️ **Error Level Analysis** – Analise a autenticidade de fotos e prints usando diferença de compressão.
35. 🪙 **Crypto Tracker** – Monitore saldo, transações e atividades de carteiras (BTC, ETH, DOGE).
36. 🔑 **Gerador de Senha** – Geração de senhas com análise de entropia e força.
37. 🛡️ **Email Blacklist** – Varre 12 bancos DNSBL em busca de reputação de IP/domínio.
38. ✉️ **Email Verify** – Verificação avançada de autenticação DNS (SPF, DKIM, DMARC).
39. ⚡ **Medidor de Velocidade** – Velocímetro de conexão e ping via Cloudflare CDN.
40. 🕸️ **Visual OSINT Graph** – Mapeador relacional de infraestrutura web (estilo Maltego).
41. 🧬 **VirusTotal Lookup** – Consulta reputação de domínios, hashes, URLs e IPs.
42. 🔎 **URLScan.io** – Analisa comportamento e gera capturas de tela de páginas suspeitas.
43. 🗃️ **Malware Bazaar** – Consulta hashes de malwares conhecidos na API do Abuse.ch.
44. 🚨 **Tor Exit Node Check** – Verifica se IP pertence à rede Tor.
45. 📲 **Telegram OSINT** – Informações e metadados de contas/canais públicos.
46. 💼 **LinkedIn Recon** – Google Dorks refinados para inteligência corporativa.
47. 🔍 **Shodan Lookup** – Varreduras ativas de portas e vulnerabilidades (CVEs) em IP/host.
48. 🗺️ **BGP / ASN Map** – Mapeia peers de ASN e prefixos CIDR via BGPView.
49. ☁️ **Cloud Range Detector** – Descobre o provedor Cloud de um IP (AWS, GCP, Azure, CF).
50. 🛡️ **WAF Detector** – Detecção e fingerprint de firewalls de aplicação Web (WAF).

---

## ⚙️ Under the Hood (Arquitetura Técnica)

O Caesar opera em uma arquitetura serverless de borda (**Cloudflare Pages**). Para garantir a privacidade do investigador (zero-logging e proteção contra vazamento do IP original) e contornar bloqueios de CORS, o tráfego de módulos sensíveis é roteado e intermediado silenciosamente por **Server Functions** nativas do *TanStack Start*. No front-end, o estado é controlado estritamente para manter a alta performance das micro-animações, entregando uma simulação autêntica e ininterrupta de um terminal de inteligência.

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

## 🧰 Plataformas OSINT Recomendadas (Web)

Para investigações complementares diretamente pelo navegador, sugerimos integrar a sua rotina com as seguintes plataformas web:

### 🔎 Buscas Avançadas
- **Google Dorks** - Permanecem eficazes para tarefas focadas; operadores como `site:`, `filetype:`, `inurl:` para encontrar informações expostas.
- **Dorksearch / GHDB** - Bases de dorks prontas.

### 📍 Imagens e Geolocalização
- **Google Reverse Image Search / TinEye** - Rastreamento de imagens.
- **GeoGuessr / Geospy** - Geolocalização por análise visual.

### 🌐 Domínios e Infraestrutura
- **DNSDumpster** - Mapeamento DNS visual.
- **Shodan** - Considerado o melhor para reconhecimento de infraestrutura, indexa dispositivos expostos na internet (IPs, portas, banners, CVEs).

### 👤 Username e Presença Digital
- **OSINT Industries** - Ferramenta de lookup em tempo real que mostra quais contas online estão vinculadas a um email, telefone, username ou carteira crypto.

### ✉️ E-mail e Vazamentos
- **Hunter.io** - Busca e validação de emails corporativos (limite de 25 buscas mensais na versão gratuita).
- **HaveIBeenPwned** - Verifica se um email aparece em vazamentos conhecidos.
- **Intelligence X** - Motor de busca que indexa dados de fontes públicas, dark web e registros históricos usando identificadores como emails, domínios, endereços cripto e telefone.

## 📚 Guias e Metodologias OSINT

- **Awesome OSINT** ([GitHub](https://github.com/jivoi/awesome-osint)) - O maior diretório mantido pela comunidade contendo listas de ferramentas e sites recomendados.
- **OSINT-BIBLE** ([GitHub](https://github.com/frangelbarrera/OSINT-BIBLE)) - Manual metodológico detalhado para conduzir investigações e relatórios de inteligência.

---

## ⚖️ Aviso Legal / Termos de Uso

> [!WARNING]
> Esta ferramenta deve ser utilizada estritamente para propósitos de segurança defensiva, pesquisa ética, jornalismo investigativo, educação ou verificação autorizada de dados próprios. Qualquer atividade maliciosa envolvendo doxxing, stalking, engenharia social ou violação das leis de privacidade locais é estritamente proibida e de inteira responsabilidade do usuário operador.
