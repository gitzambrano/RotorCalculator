# RotorCalculator — Plano Detalhado de Implementação do Sistema

> **Projeto**: RotorCalculator  
> **Plataforma**: Android (B4A — Basic4Android)  
> **Alvo**: Android 5.0 (API 16) até Android 16 (API 36) — Compatibilidade Universal  
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
├── RotorEdit.bas                 # Activity / tela de edição detalhada de rotor
├── agente.md                     # Regras de governança de código e integridade física
├── plano.md                      # Este documento detalhado
├── Key\                          # Chaves de assinatura e APIs de publicação
│   ├── key_aero_calc.keystore    # Keystore JKS oficial (alias: b4a, senha: ***REDACTED***)
│   ├── key_aero_calc.keystore.b64.txt
│   ├── play_store_service_account.json  # Credencial Google Play Android Developer API
│   ├── pepk.jar & pepk_commandline.txt
│   └── Readme_PassKey.md         # Documentação confidencial de chaves
├── Libraries\                    # Bibliotecas adicionais locais B4A
│   ├── AHViewPager.jar & .xml    # Container de abas deslizantes horizontais
│   ├── RSPopupMenu.jar & .xml    # Menus de contexto rápidos
│   └── RichString.jar & .xml     # Formatação de texto rica para fórmulas e símbolos
├── Files\                        # Recursos empacotados no APK/AAB
│   ├── icon.png                  # Ícone de alta definição do aplicativo (96x96 / mipmap)
│   ├── xenara-bold.ttf           # Fonte técnica aeronáutica
│   └── icon_*.png                # Ícones de ação (editar, duplicar, deletar, mais, etc.)
├── Icons\                        # Ícones fonte do projeto (512x512, 192x192, etc.)
├── docs\                         # Documentação teórica e especificações
│   ├── zBET-documentation.md     # Formulação matemática completa do zBET
│   └── software_requirements.md  # Requisitos funcionais (FR-*) e físicos (PH-*)
├── tools\                        # Ferramentas Python de compilação, teste e publicação
│   ├── zBET.py                   # Script de referência matemática dourada
│   ├── process_icons.py          # Gerador e conversor de resoluções de ícones
│   ├── verify_engine.py          # Harness de validação numérica comparativa B4A vs Python
│   └── b4a_build.ps1             # Automação de compilação do APK e AAB assinado
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

O layout utiliza `AHViewPager` com **3 abas principais** e um menu de ações superior responsivo.

```
+-------------------------------------------------------------+
| [RotorCalculator]      [Nome do Rotor Atual]      [Menu :]  |
+-------------------------------------------------------------+
|   [ GEOMETRIA ]     |    [ CONDIÇÕES ]    |   [ RESULTADOS ]|
|=====================                                        |
| (Indicador ciano animado na aba ativa)                      |
+-------------------------------------------------------------+
|                                                             |
|                    CONTEÚDO DA ABA ATIVA                    |
|                                                             |
+-------------------------------------------------------------+
```

### 4.1 Aba 1: Geometria (Rotores)
- **Barra de Gestão de Rotores**:
  - Seletor rápido / spinner do rotor ativo.
  - Botão `Novo (+)`: abre tela ou diálogo de criação com valores padrão coerentes.
  - Botão `Editar (Lápis)`: edição detalhada dos parâmetros geométricos do rotor selecionado.
  - Botão `Duplicar`: clona o rotor atual para permitir testes rápidos de sensibilidade (ex: "UH-60 Modificado").
  - Botão `Deletar`: exclusão segura com confirmação prévia.
- **Lista / Cards dos Parâmetros do Rotor Ativo**:
  - Card 1: **Dimensões Principais** — Raio $R$, Número de pás $N$, Recorte de raiz $r_0/R$, Área de disco $A$.
  - Card 2: **Solidez e Planta da Pá** — Seletor entre $\sigma_{\mathrm{ref}}$ direta OU Cordas de Raiz $c_{\mathrm{root}}$ e Ponta $c_{\mathrm{tip}}$, com exibição instantânea das solidezes geométrica e de empuxo.
  - Card 3: **Passo e Torção** — Modo Constante ($\theta_0$) ou Torção Linear ($\theta_{\mathrm{root}}$ e $\theta_{\mathrm{tip}}$ com indicação do $\Delta\theta_{\mathrm{twist}}$ total).
  - Card 4: **Aerofólio de Seção** — $a_0$ ($1/\mathrm{rad}$ ou $1/^\circ$) e $C_{d0}$, com botão para abrir a **Biblioteca de Aerofólios Típicos** (NACA 0012, VR-7, SC1095, Clark Y, etc.).
- **Presets de Fábrica Integrados**:
  1. *Sikorsky UH-60 Black Hawk* ($R=8.18\text{ m}, N=4, c=0.53\text{ m}, \text{twist}=-18^\circ$)
  2. *Bell 206 JetRanger* ($R=5.08\text{ m}, N=2, c=0.33\text{ m}, \text{twist}=-10^\circ$)
  3. *Eurocopter Bo 105* ($R=4.92\text{ m}, N=4, c=0.27\text{ m}, \text{twist}=-8^\circ$)
  4. *Robinson R44* ($R=5.03\text{ m}, N=2, c=0.25\text{ m}, \text{twist}=-6^\circ$)
  5. *DJI Matrice 300 Drone* ($R=0.27\text{ m}, N=2, c=0.045\text{ m}, \text{twist}=-12^\circ$)
  6. *Rotor Conceitual eVTOL* ($R=1.40\text{ m}, N=5, c=0.12\text{ m}, \text{twist}=-14^\circ$)

### 4.2 Aba 2: Condições (Condições de Voo e Atmosfera)
- **Calculador de Atmosfera ISA Integrado**:
  - Altitude: Entrada em metros ou pés.
  - Temperatura: Entrada em $^\circ\text{C}$ ou $^\circ\text{F}$, com alternador para $\Delta\text{ISA}$.
  - Exibição de Telemetria Atmosférica: Pressão atmosférica $p$, densidade $\rho$ [$\text{kg/m}^3$], e velocidade do som $a_{\mathrm{som}}$ [$\text{m/s}$].
- **Velocidade de Avanço do Rotor**:
  - Entrada via Razão de Avanço $\mu$ (ex: 0.00 a 0.40) OU Velocidade Real $V_\infty$ (km/h, nós, m/s).
- **Escoamento Axial e Atitude do Disco**:
  - Modo Ângulo de Ataque $\alpha$ [$^\circ$] (inclinação do mastro para frente/trás).
  - Modo Velocidade de Subida/Descida $w$ [m/s ou ft/min].
  - Modo Velocidade Axial Adimensional $\mu_z$.
- **Rotação**:
  - RPM do rotor ou Velocidade de Ponta $V_{\mathrm{tip}} = \Omega R$ [m/s].
- **Opções de Modelagem e Trim (Popups / Botões de Alternância)**:
  - *Trim de Pairado*: Nenhum (passo prescrito) | Coletivo ($C_T$ ou Empuxo $T$ [N/kgf/lbf] alvo) | Trim de RPM.
  - *Modelo de Influxo*: Uniforme | Coleman Simples | Coleman-Feingold (NDARC) | Drees.
  - *Perda de Ponta*: Nenhuma ($B=1.0$) | Fixa ($B=0.97$) | Sissingh.
  - *Compressibilidade*: Prandtl-Glauert Ligado/Desligado.
  - *Arrasto de Perfil*: Analítico Tangencial | Analítico Vetorial | Numérico Vetorial.

### 4.3 Aba 3: Resultados (Telemetria Instantânea e Performance)
- **Painel de Destaque Superior (Cockpit HUD)**:
  - **Empuxo Total $T$**: Exibido em Newtons (N) e quilogramas-força (kgf) ou libras-força (lbf).
  - **Potência Requerida no Eixo $P_{\mathrm{shaft}}$**: Exibida em quilowatts (kW) e cavalos-vapor (HP).
  - **Torque no Mastro $Q$**: Exibido em $\text{N}\cdot\text{m}$ e $\text{lbf}\cdot\text{ft}$.
  - **Eficiência**: Figura de Mérito ($FoM$) em pairado ou $L/D_{\mathrm{eff}}$ em avanço.
- **Tabela / Cards de Coeficientes Adimensionais**:
  - $C_T$ (Empuxo), $C_P$ (Potência), $C_Q$ (Torque Total), $C_{Qi}$ (Torque Induzido), $C_{Q0}$ (Torque de Perfil)
  - $C_H$ (Força Longitudinal Total), $C_{Hi}$ (Induzida), $C_{H0}$ (Perfil)
  - $C_Y$ (Força Lateral)
  - $C_{Mx}$ (Momento de Rolamento), $C_{My}$ (Momento de Arfagem)
  - $C_{Pair}$ (Potência do Ar)
- **Diagnóstico do Escoamento**:
  - Influxo Médio $\lambda$ e Induzido $\lambda_i$
  - Gradientes Harmônicos de Influxo $K_x$ e $K_y$
  - Ângulo de Inclinação da Esteira $\chi$ [$^\circ$]
  - Mach de Ponta na Pá Avançante $M_{\mathrm{at}}$
- **Botão de Varredura Universal de Curvas vs μ (Multi-Sweep View)**:
  - Abre um diálogo/popup interativo de tela cheia com gráfico vetorial de alta resolução renderizado via `Canvas` nativo do Android.
  - **Seletor de TODOS os Parâmetros**: Um menu com mais de 24 parâmetros aerodinâmicos e de potência disponíveis para traçar curvas em função do avanço $\mu$:
    - Coeficientes de Força e Torque: $C_T, C_P, C_Q, C_{Qi}, C_{Q0}, C_H, C_{Hi}, C_{H0}, C_Y, C_{Mx}, C_{My}, C_{Pair}$;
    - Cinemática de Influxo e Esteira: $\lambda, \lambda_i, K_x, K_y, \chi\ [^\circ], M_{\mathrm{at}}$;
    - Eficiência: $L/D_{\mathrm{eff}}, FoM$;
    - Grandezas Dimensionais: Potência no Eixo [kW, HP], Empuxo Total [N, kgf], Torque no Mastro [$\text{N}\cdot\text{m}$], Arrasto Longitudinal [N].
  - **Alternador Multi-Curvas / Comparação de Modelos**:
    - Permite traçar simultaneamente no mesmo gráfico as curvas dos **4 Modelos de Influxo** (Uniforme em prata, Coleman Simples em laranja, Coleman-Feingold em ciano, e Drees em verde esmeralda) com legenda explicativa, permitindo analisar instantaneamente a sensibilidade aos gradientes harmônicos.
  - **Alternador de Alcance de Avanço**: Permite alternar entre $\mu_{\max} = 0.40$ (faixa operacional típica) e $\mu_{\max} = 0.50$ (alto avanço / regimes extremos).
  - **Tabela de Dados**: Botão para exibir a tabela numérica com valores tabulados ponto a ponto de $\mu=0$ até $\mu_{\max}$.
  - **Destaque do Ponto Operacional Atual**: Ponto operacional de voo ativo assinalado no gráfico com mira pulsante em âmbar.

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

1. **Faixa de Suporte do Sistema Operacional**:
   - `android:minSdkVersion="16"` (compatível com Android 4.1+)
   - `android:targetSdkVersion="36"` (compatível com Android 16 e exigências da Google Play 2025/2026).
2. **Adaptação Responsiva**:
   - Suporte completo a todas as densidades (`smallScreens`, `normalScreens`, `largeScreens`, `xlargeScreens`, `anyDensity="true"`).
   - Uso de `dip` para todas as dimensões de interface e escala dinâmica proporcional baseada na largura da tela.
   - `android:windowSoftInputMode="stateHidden|adjustPan"` no Manifesto para garantir que o teclado não cubra os campos de edição ou distorça o layout.
   - Ajuste automático de áreas seguras (*edge-to-edge* / insets de barras de sistema) através de `imeInsets.GetContentRect`.
3. **Armazenamento Seguro de Dados**:
   - Uso de `RuntimePermissions.GetSafeDirDefaultExternal("")` com fallback transparente para `File.DirInternal`.
   - Assegura funcionamento perfeito sem requerer permissões perigosas ou obsoletas de armazenamento no Android 11+.

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
- Montagem do container `AHViewPager` com 3 abas interativas.
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
