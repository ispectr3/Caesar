import { promises as fs } from 'fs';
import path from 'path';

// Specific tactical descriptions for each module
const SPECIFIC_BLOCKS = {
  '/ip': {
    how: 'Realiza uma consulta GeoIP via ip-api.com, cruzando o endereço com bancos de dados de registro de ASN e geolocalização. Totalmente passiva — o servidor-alvo não recebe nenhuma requisição.',
    interpret: 'Se o ISP for AWS, DigitalOcean ou Cloudflare, a localização exibida é do datacenter, não do alvo real. Um banner de "HOSTING/VPN DETECTADO" aparecerá automaticamente nesses casos. Coordenadas geográficas precisas são mais confiáveis em ISPs residenciais.',
  },
  '/whois': {
    how: 'Consulta o protocolo RDAP (Registration Data Access Protocol), o sucessor moderno do WHOIS. Retorna registrador, datas de criação, expiração e nameservers autoritativos.',
    interpret: 'Uma data de criação recente (<90 dias) é um forte indicador de domínio criado para fraude. Verifique o registrador e cruze os nameservers com outros domínios do mesmo operador.',
  },
  '/dns': {
    how: 'Consulta todos os tipos de registro DNS via Google DNS-over-HTTPS (DoH). A operação é 100% passiva — nenhum dado é enviado ao servidor-alvo.',
    interpret: 'Registro A: IP real do servidor. MX: revela provedor de e-mail (Google, Microsoft, Proofpoint). TXT: contém SPF, DKIM e DMARC — o Score de Segurança de E-mail indica o risco de spoofing do domínio.',
  },
  '/subdomains': {
    how: 'Consulta logs de Certificate Transparency (crt.sh) para listar todos os subdomínios para os quais o domínio emitiu certificados SSL. Operação passiva e histórica.',
    interpret: 'Subdomínios como dev., staging., admin., api. e vpn. revelam infraestrutura interna. Passe cada IP encontrado no Port Scanner e IP Lookup para mapear a superfície de ataque completa.',
  },
  '/certificates': {
    how: 'Consulta os logs públicos de Certificate Transparency mantidos por Google, Cloudflare e outros. Cada certificado emitido por uma CA pública é registrado permanentemente nesses logs.',
    interpret: 'Permite descobrir subdomínios históricos, mudanças de infraestrutura e certificados auto-assinados suspeitos. Certificados com muitos SANs (Subject Alternative Names) revelam uma infraestrutura compartilhada.',
  },
  '/headers': {
    how: 'Realiza uma requisição HTTP GET ao servidor e analisa os cabeçalhos de resposta. Avalia HSTS, CSP, X-Frame-Options, X-Content-Type-Options e outros headers de segurança.',
    interpret: 'Um score baixo significa exposição a XSS, clickjacking e MITM. O cabeçalho "Server" pode revelar versão de software vulnerável. Um header "X-Powered-By" expõe a stack tecnológica.',
  },
  '/portscan': {
    how: 'Executa varredura ativa em portas HTTP comuns (80, 443, 8080, 8443, 3000, etc.) via requisições HTTP. Limitado à superfície web, sem uso de sockets raw.',
    interpret: 'Portas abertas incomuns (ex: 8888, 9200, 27017) podem indicar Elasticsearch, MongoDB ou painéis admin expostos. Cruze os resultados com o CVE Search para verificar vulnerabilidades.',
  },
  '/abuseipdb': {
    how: 'Consulta o banco de dados AbuseIPDB, alimentado por relatórios manuais e honeypots ao redor do mundo. Retorna histórico de denúncias, categorias de abuso e score de confiança.',
    interpret: 'Um score acima de 50% indica um IP comprometido ou malicioso. Categorias comuns: SSH brute force, spam, web scraping, DDoS. Use para verificar se o IP de um suspeito já tem histórico criminal.',
  },
  '/virustotal': {
    how: 'Consulta a API pública do VirusTotal para verificar a reputação de um hash, URL, IP ou domínio contra 70+ motores antivírus e serviços de análise de ameaças.',
    interpret: 'Detecções acima de 3/70 são suspeitas. Para hashes de malware, verifique o nome da família detectada e cruze com o Malware Bazaar. Para URLs, cheque se houve phishing ou distribuição de malware.',
  },
  '/malwarebazaar': {
    how: 'Consulta o repositório público Abuse.ch MalwareBazaar, que agrega amostras de malware submetidas por pesquisadores e honeypots ao redor do mundo.',
    interpret: 'Um resultado positivo confirma que o arquivo é malware documentado. A família de malware indica o tipo de ameaça (RAT, Stealer, Ransomware). Tags adicionais revelam vetores de distribuição.',
  },
  '/tor': {
    how: 'Compara o IP contra a lista oficial de nós de saída da rede Tor, publicada pelo Tor Project e atualizada a cada hora.',
    interpret: 'Um nó de saída Tor não significa necessariamente atividade maliciosa, mas torna a rastreabilidade impossível. Essencial para investigações de fraude onde o IP suspeito foi capturado.',
  },
  '/urlscan': {
    how: 'Submete a URL ao serviço URLScan.io, que a executa em um navegador instrumentado, captura screenshot, analisa o DOM, requisições de rede e geolocalização do servidor.',
    interpret: 'Verifique redirecionamentos suspeitos, presença de JavaScript ofuscado e domínios de terceiros carregados. O screenshot é crucial para documentar pages de phishing antes que sejam derrubadas.',
  },
  '/shodan': {
    how: 'Consulta a API pública do Shodan, o motor de busca de dispositivos conectados à internet. Retorna portas abertas, banners de serviço, CVEs conhecidos e metadados de sistema.',
    interpret: 'CVEs listados indicam vulnerabilidades não corrigidas. Banners revelam versões exatas de software. Combine com o Port Scanner para confirmar portas ativas e o VirusTotal para verificar reputação.',
  },
  '/cve': {
    how: 'Busca no banco de dados NVD (National Vulnerability Database) do NIST. Retorna CVEs com descrição, score CVSS e produtos afetados.',
    interpret: 'CVSS > 9.0 = CRÍTICO. Verifique se a versão de software alvo está na lista de afetados. Use o ID CVE para buscar proofs-of-concept públicos no GitHub e confirmar exploitabilidade.',
  },
  '/hibp': {
    how: 'Verifica e-mails via API oficial do Have I Been Pwned. Para senhas, usa k-Anonymity: apenas os primeiros 5 caracteres do hash SHA-1 são enviados à API — a senha original nunca sai do navegador.',
    interpret: 'E-mails em múltiplos breaches indicam alvo de alto perfil com histórico digital extenso. Tipos de dados expostos (senha, CPF, endereço) definem o risco. Cruze nicknames de breaches com o WhatsMyName.',
  },
  '/exif': {
    how: 'Lê os metadados EXIF embutidos diretamente no arquivo de imagem no seu navegador. Nenhum dado é enviado a servidores externos. Suporta JPEG, PNG, TIFF e RAW.',
    interpret: 'Coordenadas GPS revelam o local exato onde a foto foi tirada — cole no GEOINT para visualizar no mapa. O modelo da câmera e número de série podem identificar o dispositivo. A data/hora original pode contradizer um alibi.',
  },
  '/ela': {
    how: 'Comprime a imagem a 75% de qualidade JPEG e calcula a diferença pixel a pixel entre o original e a versão recomprimida. Regiões editadas apresentam maiores diferenças (aparecem mais brilhantes).',
    interpret: 'Regiões brancas/brilhantes indicam possível adulteração. Bordas nítidas em objetos inseridos são um forte sinal de montagem. Use o slider de intensidade para revelar alterações sutis. Salve a análise como PNG para documentar.',
  },
  '/cpf': {
    how: 'Valida o CPF usando o algoritmo de dígitos verificadores da Receita Federal. Extrai a região de origem (os três primeiros dígitos indicam o estado de emissão).',
    interpret: 'Um CPF válido não significa que pertence à pessoa alegada. A região de emissão pode revelar inconsistências geográficas. Módulos avançados de Dark Web requerem conexões de API.',
  },
  '/cnpj': {
    how: 'Consulta a API BrasilAPI que espelha os dados abertos da Receita Federal. Retorna razão social, situação cadastral, endereço, atividade econômica (CNAE) e quadro societário.',
    interpret: 'Uma empresa "INAPTA" ou "BAIXADA" é um red flag para fraude empresarial. Compare o endereço registrado com o endereço real. O quadro societário pode revelar vínculos com outros CNPJs suspeitos.',
  },
  '/cep': {
    how: 'Consulta a BrasilAPI para resolver o CEP em endereço completo com coordenadas geográficas. Dados provenientes dos Correios e OpenStreetMap.',
    interpret: 'Use as coordenadas retornadas para plotar no mapa via GEOINT. Um CEP inexistente ou que não corresponde à cidade alegada é um indicador de fraude de cadastro.',
  },
  '/geocode': {
    how: 'Utiliza a API de geocoding do OpenStreetMap (Nominatim) para converter um endereço textual em coordenadas geográficas e vice-versa.',
    interpret: 'Verifique se a localização retornada corresponde ao contexto da investigação. Coordenadas precisas podem ser cruzadas com dados EXIF de imagens para confirmar presença física em um local.',
  },
  '/phone': {
    how: 'Usa a biblioteca libphonenumber do Google para parsear e validar o número de telefone, identificando país, operadora, tipo de linha (fixo/móvel/VOIP) e formato internacional.',
    interpret: 'Linhas VOIP são frequentemente usadas em golpes pois são anônimas e baratas. A operadora pode revelar a região de origem. Um número com DDI incompatível com o país alegado é um red flag.',
  },
  '/email': {
    how: 'Valida o formato do e-mail, verifica se o domínio possui registros MX válidos via Google DNS e detecta provedores de e-mail descartável conhecidos.',
    interpret: 'Domínio sem MX significa que o domínio não pode receber e-mails — um e-mail desse domínio é falso. Provedores descartáveis (Mailinator, temp-mail) indicam cadastro fraudulento ou teste.',
  },
  '/username': {
    how: 'Realiza requisições HEAD/GET a 25+ plataformas sociais verificando se o username existe. Usa técnicas de detecção por status HTTP (200/404) para determinar presença.',
    interpret: 'Um username encontrado em múltiplas plataformas cria um perfil digital consistente do alvo. Plataformas inesperadas (ex: encontrar o alvo no Letterboxd ou Chess.com) revelam interesses e comportamentos.',
  },
  '/namint': {
    how: 'Gera permutações algorítmicas do nome real do alvo nos formatos mais comuns de usernames e e-mails (primeiro.ultimo, f.ultimo, ultimo.primeiro, etc.) para 18+ domínios de e-mail.',
    interpret: 'Use as variações geradas no WhatsMyName para verificar presença em redes. Copie os e-mails no HIBP para verificar vazamentos. Os e-mails podem ser usados no GHunt para identificar contas Google.',
  },
  '/ghunt': {
    how: 'Gera consultas para identificar contas Google associadas a um endereço Gmail. Técnica baseada em GAIA ID lookup via APIs públicas do Google.',
    interpret: 'Um GAIA ID válido confirma que a conta existe. A presença em serviços públicos do Google (Google Maps reviews, YouTube, etc.) expande o perfil do alvo. Cruze com o NAMINT para validar outros e-mails do alvo.',
  },
  '/gitfive': {
    how: 'Rastreia commits públicos em repositórios do GitHub para identificar e-mails reais de desenvolvedores — o Git registra o e-mail do autor em cada commit por padrão.',
    interpret: 'O e-mail encontrado pode ser diferente do e-mail de cadastro do GitHub. Use o e-mail no HIBP and GHunt. Repositórios contribuídos revelam stack tecnológica e interesses profissionais.',
  },
  '/mosint': {
    how: 'Agrega verificações de inteligência sobre e-mails: existência em provedores conhecidos, presença em redes sociais, Have I Been Pwned, Gravatar e outros serviços.',
    interpret: 'Um e-mail com Gravatar pode ter a foto de perfil associada, revelando a aparência do alvo. A presença em múltiplos serviços indica um e-mail antigo e central na identidade digital do alvo.',
  },
  '/scam': {
    how: 'Analisa heuristicamente o texto de uma mensagem procurando padrões típicos de golpes: urgência artificial, promessas de ganho, pedidos de PIX/senha, links suspeitos e erros ortográficos deliberados.',
    interpret: 'Uma pontuação alta indica golpe com alta confiabilidade. Os padrões detectados explicam quais táticas de engenharia social o golpista está usando. Use para documentar e reportar casos.',
  },
  '/hash': {
    how: 'Identifica o algoritmo de hash por tamanho e charset (hexadecimal, base64, crypt format). Tenta crackear hashes MD5, SHA-1 e SHA-256 via dicionário offline e consultas a bancos de hash online.',
    interpret: 'Um hash crackeado revela a senha original — documente antes de usar. Um hash MD5 ou SHA-1 é considerado INSEGURO para armazenamento de senhas. Hashes bcrypt/Argon2 são resistentes a força bruta.',
  },
  '/encoder': {
    how: 'Codifica e decodifica texto nos formatos Base64, URL Encoding, Hex, HTML Entities e Binário. Operação 100% local no navegador, sem envio de dados a servidores.',
    interpret: 'Strings Base64 codificadas são comuns em payloads de malware e exfiltração de dados. Decodifique strings suspeitas encontradas em logs para revelar o conteúdo oculto.',
  },
  '/regex': {
    how: 'Aplica expressões regulares predefinidas para extrair padrões de texto: IPs, e-mails, URLs, CPFs, CNPJs, hashes e outros. Operação local, sem chamadas de rede.',
    interpret: 'Use para extrair IOCs (Indicators of Compromise) de logs de sistema, e-mails maliciosos ou código suspeito. Múltiplos IPs encontrados em um log podem ser pivotados no IP Lookup.',
  },
  '/dorks': {
    how: 'Gera queries avançadas do Google (Google Dorks) para encontrar arquivos expostos, páginas de login, diretórios abertos e informações sensíveis indexadas sobre um domínio-alvo.',
    interpret: 'Os dorks são links diretos para o Google — clique em cada um para ver os resultados em tempo real. Arquivos .env, .sql, .bak e diretórios /admin expostos são vulnerabilidades críticas a documentar.',
  },
  '/filephish': {
    how: 'Gera Google Dorks especializados para encontrar tipos específicos de documentos (PDF, Excel, Word, CSV) expostos publicamente no domínio alvo.',
    interpret: 'Documentos internos indexados pelo Google são uma falha grave de segurança. PDFs podem conter metadados de autores, versões de software e caminhos de rede internos (extraia com EXIF Extractor).',
  },
  '/registro': {
    how: 'Consulta o WHOIS do Registro.br via API para domínios .br. Retorna proprietário (CPF ou CNPJ mascarado), organização, contato e servidores DNS.',
    interpret: 'Domínios .br registrados em CPF em vez de CNPJ são de pessoa física. Cruce o responsável técnico com o CPF/CNPJ Search. Datas de criação recentes associadas a nomes de marcas conhecidas indicam cybersquatting.',
  },
  '/datajud': {
    how: 'Consulta a API CNJ DataJud com o número único processual para recuperar metadados do processo: classe, assunto, tribunal, vara e movimentações processuais.',
    interpret: 'Processos criminais, falências e execuções fiscais revelam o histórico jurídico do alvo. Cruze o número do processo com o nome do advogado para identificar conexões entre investigados.',
  },
  '/bgp': {
    how: 'Consulta a API BGPView para mapear o sistema autônomo (ASN): prefixos de IP anunciados, peers (conexões com outros ASNs) e informações da organização registrante.',
    interpret: 'Um ASN com muitos prefixos e peers é de uma grande empresa ou ISP. ASNs com poucos prefixos podem ser de hosting providers obscuros usados para infraestrutura criminosa. Cruze os prefixos com o IP Lookup.',
  },
  '/cloudrange': {
    how: 'Verifica se o IP está contido nos ranges de IP públicos de AWS, GCP, Azure, Cloudflare e DigitalOcean, consumindo as listas oficiais de cada provedor.',
    interpret: 'Um IP em range de cloud confirma que é infraestrutura, não residencial. O provedor identificado pode revelar qual serviço o alvo está usando (ex: Cloudflare Pages, AWS Lambda). Útil para mapear a stack de uma organização.',
  },
  '/waf': {
    how: 'Realiza requisições HTTP com payloads de fingerprint para detectar a presença de Web Application Firewalls (WAF) como Cloudflare, Akamai, Imperva e F5 com base nas respostas e headers.',
    interpret: 'A presença de um WAF indica maturidade de segurança. Cloudflare especificamente mascara o IP real do servidor. Para encontrar o IP real atrás de um WAF, cruze com DNS histórico e Certificate Transparency.',
  },
  '/leaklooker': {
    how: 'Consulta o Shodan InternetDB para identificar portas abertas e vulnerabilidades associadas ao alvo.',
    interpret: 'Um banco de dados exposto é um vazamento crítico. Analise as portas de banco encontradas e cruze com vulnerabilidades CVE conhecidas.',
  },
  '/favicon': {
    how: 'Baixa o favicon do site, calcula seu MurmurHash3 e exibe o valor pronto para buscas no Shodan (query: http.favicon.hash:XXXXXXXX). Permite encontrar outros servidores usando o mesmo favicon.',
    interpret: 'O mesmo hash de favicon em múltiplos IPs indica a mesma aplicação/empresa. Útil para descobrir infraestrutura oculta de um alvo que usa o mesmo template ou painel de controle em vários servidores.',
  },
  '/graph': {
    how: 'Realiza DNS Lookup e WHOIS em paralelo para o domínio e constrói um grafo visual interativo relacionando domínio, IPs (registro A), servidores de e-mail (MX) e registrador.',
    interpret: 'Clique nos nós para expandir informações. IPs mostram geolocalização automática. Use o grafo para visualizar relações entre infraestruturas e identificar pontos de pivotamento para investigação mais profunda.',
  },
  '/telegram': {
    how: 'Gera links diretos para perfis, canais e grupos públicos no Telegram. Pesquisa passiva via @username ou t.me/canal sem necessidade de conta.',
    interpret: 'Canais públicos do Telegram são indexados e acessíveis. Use para investigar grupos de interesse investigativo, mapear administradores e identificar outros alvos mencionados nas conversas públicas.',
  },
  '/linkedin': {
    how: 'Gera Google Dorks especializados para o LinkedIn, buscando perfis de pessoas, páginas de empresas e funcionários com cargos específicos.',
    interpret: 'Perfis do LinkedIn revelam histórico de emprego, conexões e habilidades. A lista de funcionários de uma empresa é útil para mapear estrutura organizacional e identificar alvos para engenharia social.',
  },
  '/password': {
    how: 'Gera senhas criptograficamente seguras usando a API Web Crypto do navegador (crypto.getRandomValues). 100% local, sem envio de dados a servidores.',
    interpret: 'Use para criar senhas seguras para operações encobertas. Senhas de pelo menos 20 caracteres com símbolos são resistentes a ataques de força bruta com hardware de última geração.',
  },
  '/crypto': {
    how: 'Consulta APIs públicas de blockchain (BlockCypher, Blockchain.info) para verificar saldo, transações e histórico de endereços Bitcoin, Ethereum e outras criptomoedas.',
    interpret: 'Um endereço com histórico de transações cria um rastro financeiro imutável na blockchain. Carteiras com grandes movimentações podem ser rastreadas em serviços como Chainalysis. Documente endereços encontrados em investigações.',
  },
  '/timestamp': {
    how: 'Converte timestamps Unix para datas legíveis e vice-versa. Suporta timestamps em segundos e milissegundos. Operação 100% local.',
    interpret: 'Use para interpretar timestamps encontrados em logs de sistema, headers HTTP, cookies e metadados de arquivos. A diferença de fuso horário pode revelar a localização geográfica de um servidor.',
  },
  '/speedtest': {
    how: 'Realiza download de payloads de teste via Cloudflare Edge para medir a velocidade de download e latência da sua conexão atual.',
    interpret: 'Útil para verificar a qualidade da conexão durante operações de campo. Alta latência pode indicar uso de VPN ou proxy na sua própria conexão, o que pode afetar a precisão de ferramentas sensíveis a timing.',
  },
  '/emailblacklist': {
    how: 'Verifica se o domínio ou IP está listado em 12+ DNSBLs (DNS-based Blackhole Lists) utilizadas por servidores de e-mail para filtrar spam e malware.',
    interpret: 'Um domínio/IP em blacklist terá seus e-mails rejeitados ou marcados como spam por padrão. Essencial para investigações de spam e phishing. Listagem em múltiplas blacklists indica histórico de abuso.',
  },
  '/emailverify': {
    how: 'Verifica a existência de um e-mail via SMTP sem enviar e-mail real (técnica RCPT TO). Checa também MX records, SPF e status de domínio.',
    interpret: 'Um e-mail confirmado via SMTP existe na caixa de correio real. Use com cautela — alguns servidores bloqueiam verificações SMTP como proteção de privacidade, gerando falsos negativos.',
  },
};

const ACTIVE_MODULES = new Set([
  '/portscan',
  '/headers',
  '/waf',
  '/emailverify'
]);

async function main() {
  const routesDir = path.join(process.cwd(), 'src/routes');
  const files = await fs.readdir(routesDir);
  const tsxFiles = files.filter(f => f.endsWith('.tsx') && f !== 'index.tsx' && f !== '__root.tsx');

  let changedCount = 0;

  await Promise.all(tsxFiles.map(async (file) => {
    const routePath = `/${file.replace('.tsx', '')}`;
    const block = SPECIFIC_BLOCKS[routePath];
    
    if (!block) return;

    const filePath = path.join(routesDir, file);
    try {
      let content = await fs.readFile(filePath, 'utf8');

      // 1. Check if we need to add ModuleInfoTabs import
      if (!content.includes('ModuleInfoTabs')) {
        // Find import section
        content = content.replace(
          /import\s*\{([^}]*?ToolForm[^}]*?)\}\s*from\s*["']([^"']+)["']/g,
          (match, p1, p2) => {
            if (p1.includes('ModuleInfoTabs')) return match;
            return `import { ${p1.trim().replace(/,$/, '')}, ModuleInfoTabs } from "${p2}"`;
          }
        );
      }

      // 2. Define the new ModuleInfoTabs block
      const isPassive = !ACTIVE_MODULES.has(routePath);
      const howText = block.how.replace(/"/g, '\\"');
      const interpretText = block.interpret.replace(/"/g, '\\"');
      
      const newTabsBlock = `
        ) : (
          <ModuleInfoTabs
            how="${howText}"
            interpret="${interpretText}"
            isPassive={${isPassive}}
          />
        )}
      </ToolForm>`;

      // 3. Try Pattern 1: Replacing the Ternary Else Grid
      const ternaryRegex = /\)\s*:\s*\(\s*<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">[\s\S]+?<\/ToolForm>/;
      let newContent = content.replace(ternaryRegex, newTabsBlock);

      // 4. Try Pattern 2: Converting Short Circuits to Ternary
      if (content === newContent) {
        const scRegex = /\{((?:status === "success" &&\s*)?result)\s*&&\s*\(\s*([\s\S]+?)\s*\)\s*\}\s*<\/ToolForm>/;
        
        const scReplacement = `{$1 ? (
          $2
        ) : (
          <ModuleInfoTabs
            how="${howText}"
            interpret="${interpretText}"
            isPassive={${isPassive}}
          />
        )}
      </ToolForm>`;
        
        newContent = content.replace(scRegex, scReplacement);
      }

      // 5. If changes made, write file
      if (content !== newContent) {
        await fs.writeFile(filePath, newContent, 'utf8');
        changedCount++;
        console.log(`Updated specific tabs for: ${file}`);
      }
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
    }
  }));

  console.log(`\nCOMPLETED: Updated ${changedCount} modules with ModuleInfoTabs.`);
}

main();
