# RotorCalculator — Plano Detalhado de Implementação do Sistema

> **Projeto**: RotorCalculator  
> **Plataforma**: Android (B4A — Basic4Android)  
> **Alvo**: Android 5.0 (API 21) até Android 16 (API 36) — Compatibilidade Universal  
> **Localização**: `C:\Projetos\RotorCalculator`  
> **Base Científica**: Teoria do Elemento de Pá e Teoria do Momentum (zBET — Wayne Johnson & Leishman)

---

## 1. Visão Geral e Objetivos do Produto

O **RotorCalculator** é um aplicativo móvel avançado para Android projetado para engenheiros aeronáuticos, pesquisadores, projetistas de eVTOLs, helicópteros e drones, bem como estudantes de aerodinâmica de asas rotativas. 

O sistema oferece um cálculo instantâneo e rigoroso do desempenho aerodinâmico de rotores em voo pairado (*hover*) e voo de avanço (*forward flight*), empregando a formulação semi-analítica do **zBET** com integração de momentos radiais, teoria do momentum global com esteira inclinada, gradientes de influxo harmônico (Uniforme, Coleman, Coleman-Feingold/NDARC e Drees), correções de compressibilidade e perda de ponta, além de quadratura vetorial de arrasto de perfil.

### Diferenciais em Relação ao AeroCalculator:
- **Herança de Sucesso**: Mantém o fluxo consagrado do AeroCalculator — abas deslizantes de alta resposta, banco de dados local com biblioteca de aeronaves/rotores salvos, e cálculo instantâneo reativo.
- **Acabamento "Ultra-Premium"**: Design escuro *cyber-cockpit* / *titanium glass*, com paleta de contraste calibrada (ciano elétrico `#00E5FF`, verde esmeralda `#00E676`, acentos em laranja âmbar `#FFB300`), tipografia nítida e cartões de telemetria estilizados.
- **Rigor Físico Exaustivo**: Toda a física foi validada contra o zBET de referência e as obras seminais de Wayne Johnson (*Rotorcraft Aeromechanics*) e J. Gordon Leishman (*Principles of Helicopter Aerodynamics*).
- **Popups de Apoio e Ferramentas**: Popups para escolha de aerofólios típicos, conversão rápida de unidades e gráficos interativos de varredura gerados via `Canvas` nativo do Android.

---

## 2. Estrutura do Diretório e Arquivos Portados

Todo o código, ferramentas, documentação, bibliotecas e certificados residem estritamente dentro de `C:\Projetos\RotorCalculator`:

```text
C:\Projetos\RotorCalculator\
├── RotorCalculator.b4a           # Ponto de entrada do aplicativo no B4A
├── zBETEngine.bas                # Motor de cálculo aerodinâmico zBET (Módulo puro B4A)
├── RotorStorage.bas              # Módulo de persistência e presets de geometrias de rotores
├── agente.md                     # Regras de governança de código e integridade física
├── plano.md                      # Este documento detalhado
├── Key\                          # Chaves de assinatura e APIs de publicação
│   ├── key_aero_calc.keystore    # Keystore JKS oficial (alias: b4a, senha: ***REDACTED***)
│   ├── key_aero_calc.keystore.b64.txt
│   ├── play_store_service_account.json  # Credencial Google Play Android Developer API
│   ├── pepk.jar & pepk_commandline.txt
│   └── Readme_PassKey.md         # Documentação confidencial de chaves
├── Libraries\                    # Bibliotecas adicionais locais B4A
│   └── RSPopupMenu.jar & .xml    # Única biblioteca externa usada no runtime
├── Files\                        # Recursos empacotados no APK/AAB
│   ├── icon.png                  # Ícone de alta definição do aplicativo (96x96 / mipmap)
│   ├── xenara-bold.ttf           # Fonte técnica aeronáutica
│   └── icon_*.png                # Ícones de ação (editar, duplicar, deletar, mais, etc.)
├── Icons\                        # Ícones fonte do projeto (512x512, 192x192, etc.)
├── docs\                         # Documentação teórica e especificações
│   └── zBET-documentation.md     # Formulação matemática completa do zBET
├── tools\                        # Ferramentas Python de compilação, teste e publicação
│   ├── zBET.py                   # Script de referência matemática dourada
│   ├── process_icons.py          # Gerador e conversor de resoluções de ícones
│   ├── verify_engine.py          # Harness de validação numérica
│   ├── ci_ui_qa.sh               # Screenshots e smoke tests do APK real em emulador
│   └── b4a_build.ps1             # Automação local de compilação B4A
└── tests\                        # Suíte de casos de teste automatizados
```

---

## 3. Arquitetura do Motor Aerodinâmico (`zBETEngine.bas`)

O módulo `zBETEngine.bas` é projetado como uma biblioteca pura sem acoplamento com a interface do usuário ou APIs específicas do Android.

### 3.1 Definições Geométricas
- **Raio do Rotor $R$**: Raio da ponta da pá em metros.
- **Recorte de Raiz $x_0 = r_0 / R$**: Posição adimensional onde se inicia a superfície sustentadora ativa ($0 \le x_0 < 1$).
- **Número de Pás $N$**: Quantidade de pás do rotor.
- **Distribuição de Corda e Solidez**:
  - Corda linear: $c(x) = c_{\mathrm{root}} + (c_{\mathrm{tip}} - c_{\mathrm{root}}) \frac{x - x_0}{1 - x_0}$
  - Solidez local: $\sigma(x) = \frac{N c(x)}{\pi R} = s_0 + s_1 x$
  - Três definições clássicas reportadas:
    1. $\sigma_{\mathrm{ref}} = s_0 + \frac{s_1}{2}$ (extrapolada até o centro $r=0$);
    2. $\sigma_{\mathrm{geom}} = (1 - x_0)[s_0 + \frac{s_1}{2}(1 + x_0)]$ (área física real);
    3. $\sigma_{\mathrm{thrust}} = 3 [s_0 \frac{1 - x_0^3}{3} + s_1 \frac{1 - x_0^4}{4}]$ (ponderada por $x^2$).
- **Distribuição de Passo $\theta(x)$**:
  - Passo uniforme: $\theta(x) = \theta_0$
  - Torção linear: $\theta(x) = \theta_{\mathrm{root}} + (\theta_{\mathrm{tip}} - \theta_{\mathrm{root}}) \frac{x - x_0}{1 - x_0} = t_0 + t_1 x$
- **Aerodinâmica de Seção**:
  - Inclinação da curva de sustentação $a_0 = dC_l/d\alpha$ (padrão: $5.73\text{ rad}^{-1}$).
  - Coeficiente de arrasto de perfil parasita $C_{d0}$ (padrão: $0.009$).

### 3.2 Correções Aerodinâmicas
1. **Perda de Ponta ($B$)**:
   - `none`: $B = 1.0$
   - `fixed`: $B = 0.97$
   - `sissingh`: $B = 1 - \frac{\sqrt{2 C_T}}{N}$
2. **Compressibilidade (Prandtl-Glauert)**:
   - Mach da ponta na pá avançante: $M_{\mathrm{at}} = \frac{\Omega R (1 + \mu)}{a_{\mathrm{som}}}$
   - Se ativado e $M_{\mathrm{at}} < 1.0$: $a = \frac{a_0}{\sqrt{1 - M_{\mathrm{at}}^2}}$.

### 3.3 Modelos de Influxo Harmônico
A velocidade induzida adimensional tem a distribuição:

$$\lambda_d(x, \psi) = \lambda + x(\lambda_{1c}\cos\psi + \lambda_{1s}\sin\psi)$$

com $\lambda = \mu_z + \lambda_i$, $\lambda_{1c} = K_x \lambda_i$, $\lambda_{1s} = K_y \lambda_i$, e inclinação de esteira:

$$\tan\frac{\chi}{2} = \frac{\mu}{\sqrt{\mu^2 + \lambda^2} + |\lambda|}$$

Os quatro modelos implementados são:
1. **Uniform**: $K_x = 0$, $K_y = 0$
2. **Coleman Simple**: $K_x = \tan\frac{\chi}{2}$, $K_y = 0$
3. **Coleman-Feingold (NDARC)**: $K_x = f_x \frac{15\pi}{32}\tan\frac{\chi}{2}$, $K_y = -f_y 2\mu$
4. **Drees**: $K_x = \frac{4}{3}(1 - 1.8\mu^2)\tan\frac{\chi}{2}$, $K_y = -2\mu$

### 3.4 Resolução do Ponto de Operação (Momentum Closure)
A velocidade induzida média $\lambda_i \ge 0$ é a raiz da equação não-linear que iguala a teoria do momentum global com o empuxo integrado do BET:

$$C_T^{\mathrm{BET}}(\lambda_i) = 2 B^2 \lambda_i \sqrt{\mu^2 + (\mu_z + \lambda_i)^2}$$

Onde $C_T^{\mathrm{BET}}$ é calculado de forma fechada e analítica através dos momentos radiais:

$$J_n = \frac{B^{n+1} - x_0^{n+1}}{n+1}$$

$$I_m = s_0 J_m + s_1 J_{m+1}$$

$$T_m = p_0 J_m + p_1 J_{m+1} + p_2 J_{m+2}$$

$$C_T = \frac{a}{2} \left[ T_2 + \frac{\mu^2}{2} T_0 - \left(\lambda + \frac{\mu\lambda_{1s}}{2}\right) I_1 \right]$$

A solução é encontrada via algoritmo de bissecção ultrarrápido (convergindo em menos de 50 iterações com resíduo $< 10^{-13}$).

### 3.5 Forças e Momentos Integrados
- **Força Longitudinal Induzida**: $C_{Hi} = \frac{a}{4} [\lambda\mu T_0 + \lambda_{1s}(T_2 - 2\lambda I_1)]$
- **Força Lateral**: $C_Y = -\frac{a \lambda_{1c}}{4}(T_2 - 2\lambda I_1)$
- **Momento de Rolamento**: $C_{Mx} = -\frac{a\mu}{2}(T_2 - \frac{\lambda I_1}{2}) + \frac{a \lambda_{1s}}{4} I_3$
- **Momento de Arfagem**: $C_{My} = \frac{a \lambda_{1c}}{4} I_3$

### 3.6 Modelos de Arrasto de Perfil ($C_{H0}, C_{Q0}$)
- **Analítico Tangencial**: $C_{H0} = \frac{C_{d0}\mu}{2}I_1$, $C_{Q0} = \frac{C_{d0}}{2}(I_3 + \frac{\mu^2}{2}I_1)$
- **Analítico Vetorial**: $C_{H0} = \frac{3 C_{d0}\mu}{4}I_1$, $C_{Q0} = \frac{C_{d0}}{2}[I_3 + (\frac{3}{4}\mu^2 + \frac{1}{2}\mu_z^2)I_1]$
- **Numérico Vetorial**: Quadratura radial e azimutal considerando a velocidade total resultante $W = \sqrt{u_T^2 + u_R^2 + \mu_z^2}$.

### 3.7 Potência, Torque e Eficiência
- **Torque Induzido**:
  - `energy_balance`: $C_{Qi} = K_{\mathrm{ind}}\lambda_i C_T + \mu_z C_T - \mu C_{Hi}$
  - `analytical_bet`: integral direta do momento em torno do eixo do mastro.
- **Torque Total**: $C_Q = C_{Qi} + C_{Q0}$
- **Potência de Eixo**: $C_{P,\mathrm{shaft}} = C_Q \implies P_{\mathrm{shaft}} = C_Q \rho A (\Omega R)^3$ [W]
- **Potência do Ar**: $C_{Pair} = K_{\mathrm{ind}}\lambda_i C_T + \mu_z C_T + C_{Q0} + \mu C_{H0}$
- **Figura de Mérito (Hover)**: $FoM = \frac{C_T^{3/2} / \sqrt{2}}{C_Q}$
- **Eficiência Efetiva Sustentação/Arrasto**: $L/D_{\mathrm{eff}} = \frac{C_T \mu}{C_{Pair}} = \frac{T V_\infty}{P_{\mathrm{air}}}$

---

## 4. Arquitetura do Frontend e Design de Interface

O frontend usa exclusivamente componentes B4A nativos. As três páginas principais — **Geometry**, **Conditions** e **Results** — são painéis independentes controlados pelas tabs fixas do header. Não há `painéis nativos`, `IME`, `RichString`, `RuntimePermissions` ou navegação baseada em bibliotecas legadas.

O layout é responsivo desde 320dp, possui largura máxima de conteúdo em tablets, mantém alvos acionáveis de pelo menos 48dp e possui tratamento específico para landscape. Labels e unidades são apresentadas como tipografia; superfícies elevadas são reservadas a campos e controles realmente interativos. Em telas compactas apenas os rótulos que precisam são abreviados, mantendo o significado completo por tooltip.

### 4.1 Geometry

- Spinner do rotor ativo e ação **COPY** para criar uma configuração customizada a partir do preset atual.
- Edição direta de raio, RPM, número de pás, root cutout, cordas, pitch/twist, lift slope e Cd0.
- Biblioteca de aerofólios; quando os coeficientes não correspondem a uma entrada conhecida, a UI mostra **Custom Section**.
- Tip-loss com seleção explícita entre **Off**, **Fixed B** e **Sissingh**.
- Compressibilidade Prandtl-Glauert com estado explícito.
- Exclusão do rotor ativo no menu superior com confirmação. Reset de presets de fábrica também exige confirmação.
- Persistência em `File.DirInternal`, sem permissões externas.

### 4.2 Conditions

- Altitude [m], temperatura [°C], advance ratio μ, velocidade [km/h], shaft tilt α [deg] e climb rate [m/s].
- μ e velocidade são sincronizados com o raio e RPM atuais; μz é atualizado junto com shaft tilt e climb rate.
- Modelos de inflow: Uniform, Coleman Simple, Coleman-Feingold e Drees.
- Modelos de profile drag: Analytical Tangential, Analytical Vectorial e Numerical Vectorial.
- Trim manual ou coletivo. **Target Thrust** e **Target CT** são mutuamente exclusivos e o botão de trim identifica qual alvo governa o cálculo.
- Geometry e Conditions permanecem coerentes durante recriação/rotação da Activity.

### 4.3 Results

Os resultados são organizados visualmente em **Thrust & Power**, **Forces & Moments**, **Efficiency**, **Inflow & Wake** e **Mach & Atmosphere**. A tabela reporta grandezas dimensionais e coeficientes, incluindo CT, CPair, CQ, CQi, CQ0, CH, CY, CMy, CMx, FoM, L/D, λ, λi, Kx, Ky, χ e Mach. O menu alterna somente as unidades de saída entre SI e Imperial.

### 4.4 Parameter Sweep

O Sweep usa `Canvas` nativo e permite selecionar a grandeza do eixo Y, comparar modelos de inflow, α, Vz ou a condição ativa e alternar μ máximo. Portrait usa controles empilhados; landscape usa uma única faixa horizontal de controles para preservar altura útil do gráfico. O botão Back fecha o Sweep antes de navegar entre tabs.

---

## 5. Popups e Diálogos de Apoio ao Usuário

Para manter a interface ultra fácil, limpa e intuitiva, parâmetros avançados e dados de apoio são apresentados através de popups acionados por toque:

1. **Popup Biblioteca de Aerofólios**:
   - Tabela com aerofólios comuns de pás de rotor:
     - NACA 0012 ($a_0 = 5.73\text{ rad}^{-1}, C_{d0} = 0.009$)
     - NACA 23012 ($a_0 = 5.85\text{ rad}^{-1}, C_{d0} = 0.0085$)
     - VR-7 Boeing Vertol ($a_0 = 5.90\text{ rad}^{-1}, C_{d0} = 0.0095$)
     - Sikorsky SC1095 ($a_0 = 6.00\text{ rad}^{-1}, C_{d0} = 0.0088$)
     - Clark Y ($a_0 = 5.65\text{ rad}^{-1}, C_{d0} = 0.0100$)
   - Ao selecionar, preenche automaticamente os campos de sustentação e arrasto do rotor.
2. **Popup Conversor Rápido de Unidades**:
   - Conversor interativo entre unidades aeronáuticas (kW $\leftrightarrow$ HP, N $\leftrightarrow$ kgf $\leftrightarrow$ lbf, nós $\leftrightarrow$ km/h $\leftrightarrow$ m/s, m $\leftrightarrow$ ft, mm $\leftrightarrow$ pol).
3. **Popup Explicativo de Modelos de Influxo**:
   - Breve cartão explicativo indicando quando usar cada modelo:
     - *Uniforme*: Estimativas preliminares rápidas.
     - *Coleman Simples*: Considera o gradiente longitudinal simples da esteira.
     - *Coleman-Feingold (NDARC)*: Padrão da indústria e NASA para simulações abrangentes.
     - *Drees*: Formulação clássica com forte validação experimental para gradientes laterais e longitudinais.
4. **Popup de Gráfico de Desempenho (Canvas Polar)**:
   - Renderização gráfica direta na tela com curva de potência vs velocidade, eixos graduados e ponto de operação atual destacado com uma mira pulsante.

---

## 6. Compatibilidade Universal Android e Especificações Técnicas

1. **Sistema operacional**:
   - `android:minSdkVersion="21"` (Android 5.0+).
   - `android:targetSdkVersion="36"`.
2. **Runtime B4A**:
   - Bibliotecas declaradas: `core`, `phone`, `RSPopupMenu`.
   - `#MultiDex: False`.
   - Navegação por três painéis nativos, sem ViewPager.
3. **Responsividade**:
   - Gate visual em 320×568, 320×568 com font scale 1.3, 360×780, 393×873, 412×915, 600×960, 768×1024, 915×412 e 1024×600.
   - Uso de `dip`, ScrollViews nativas, largura máxima em tablets e layout próprio do Sweep em landscape.
   - `android:windowSoftInputMode="stateHidden|adjustPan"`.
4. **Armazenamento**:
   - Presets são gravados em `File.DirInternal`; nenhuma permissão de armazenamento é necessária.
5. **Validação de release**:
   - `tools/verify_engine.py` e `tests/test_rotor_engine.py`.
   - Build B4A real, APK instalável, execução em emulador, dumps de hierarquia, bounds e screenshots reais.
   - Smoke tests cobrem presets/cópia, tip-loss, compressibilidade, airfoil, modelos, trim, rotação, SI/Imperial, Sweep e delete.

---

## 7. Fases de Execução do Desenvolvimento

### Fase 1: Fundação do Projeto e Módulo de Geometrias
- Criação dos arquivos `.b4a` e manifestos do **RotorCalculator**.
- Implementação de `RotorStorage.bas` com persistência em arquivo de texto/mapa e biblioteca de 6 presets de fábrica.
- Criação da tela de gerenciamento de geometrias com lista rolável e operações CRUD.

### Fase 2: Implementação e Validação Numérica do Engine
- Codificação de `zBETEngine.bas` contendo:
  - Momentos radiais analíticos ($J_n, I_m, T_m$).
  - Resolução do influxo não-linear $\lambda_i$ por bissecção.
  - Modelos de influxo Uniforme, Coleman, Coleman-Feingold e Drees.
  - Correção de compressibilidade e perda de ponta (Sissingh).
  - Arrasto de perfil analítico e quadratura vetorial.
  - Modos de trim de hover (Coletivo, RPM, Nenhum).
- Criação do script de verificação `tools/verify_engine.py` comparando B4A com `tools/zBET.py` em uma matriz de 100 casos com tolerância estrita $< 10^{-6}$.

### Fase 3: Desenvolvimento do Frontend (UI/UX Premium)
- Montagem das 3 páginas nativas (`Geometry`, `Conditions`, `Results`) com tabs responsivas no header.
- Aba 1: Lista e detalhes dos rotores.
- Aba 2: Controles de condições atmosféricas (ISA), velocidade de avanço e atitude do disco.
- Aba 3: Cockpit de telemetria com cartões de empuxo, potência, torque, eficiência e coeficientes adimensionais.
- Aplicação do estilo visual premium (paleta escura, fontes técnicas, realces em ciano e esmeralda).

### Fase 4: Popups de Apoio, Conversores e Gráficos
- Implementação dos popups de apoio (Aerofólios, Influxo, Conversores de Unidades).
- Desenvolvimento do visualizador gráfico em `Canvas` para varreduras rápidas de potência e empuxo vs $\mu$.

### Fase 5: Empacotamento, Testes Finais e Release
- Testes em emulador e múltiplos fatores de forma.
- Verificação da assinatura digital com `Key\key_aero_calc.keystore` (alias: `b4a`).
- Geração do `.aab` de lançamento para a Google Play Store.
