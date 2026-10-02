# AGENTE.md — Regras de Trabalho e Governança do RotorCalculator

Este documento define os princípios fundamentais, padrões de código, governança aerodinâmica e fluxo de trabalho para o desenvolvimento do **RotorCalculator** no ecossistema Android com B4A (Basic4Android).

---

## 1. Fonte da Verdade e Governança Científica

1. **Documentação Teórica**:
   - As equações matemáticas e convenções físicas do rotor são governadas por `docs/zBET-documentation.md`, com base na literatura clássica:
     - Wayne Johnson, *Rotorcraft Aeromechanics* (Capítulos 6 e 7).
     - J. Gordon Leishman, *Principles of Helicopter Aerodynamics* (Capítulos 3 e 5).
     - W. Z. Stepniewski, *Rotary-Wing Aerodynamics*.
2. **Precedência de Decisões Numéricas**:
   - (1) Literatura aerodinâmica formal revisada;
   - (2) Implementação de referência em Python (`tools/zBET.py`);
   - (3) Requisitos de software e plano em `plano.md`;
   - (4) Casos de validação numérica dourada em `tests/`.
3. **Nenhuma Alteração Física sem Justificativa**:
   - Qualquer modificação em equações de influxo, momentos radiais, coeficientes de arrasto ou fatores de correção (Prandtl-Glauert, Sissingh, Drees, Coleman) deve vir acompanhada da respectiva fundamentação e tolerância numérica explícita.

---

## 2. Arquitetura de Software (Clean Boundary)

A aplicação deve obedecer estritamente à separação de camadas:

$$\text{GUI / Telas} \longrightarrow \text{Validação \& Conversão SI} \longrightarrow \text{zBETEngine (Puro)} \longrightarrow \text{Formatação} \longrightarrow \text{GUI / Exibição}$$

### Regras do Engine (`zBETEngine.bas`):
- **Isolamento Total**: O motor de cálculo **não deve** referenciar componentes de interface (Label, EditText, Panel), bibliotecas de sensores ou chamadas diretas de UI do Android.
- **Entrada Padronizada**: Recebe tipos ou parâmetros em unidades fundamentais do SI (kg/m³, m/s, rad, rad/s, N, N·m, W) ou adimensionais ($\mu, \mu_z, \alpha, \lambda, \sigma, C_T, C_Q$).
- **Saída Estruturada**: Retorna um tipo de dados completo contendo todos os coeficientes adimensionais e grandezas dimensionais calculadas.
- **Portabilidade**: Deve permitir execução autônoma em linha de comando (B4J ou harness de teste) sem modificações no algoritmo.

### Camada de Armazenamento (`RotorStorage.bas` / `clsRotorManager.bas`):
- Gerenciamento autônomo das geometrias salvas no armazenamento privado do app (`File.DirInternal`), sem permissões externas de armazenamento.
- Suporte a presets de fábrica (UH-60, Bell 206, Bo 105, R44, DJI Drone) e criação ilimitada de rotores customizados com operações completas de CRUD (Criar, Ler, Atualizar, Duplicar, Deletar).

---

## 3. Padrões de Interface Humana e Compatibilidade Android

1. **Responsividade Universal**:
   - Deve funcionar perfeitamente em telas compactas (320dp de largura), telas comuns (360dp a 412dp), landscape e tablets (600dp+), incluindo font scale de 130%.
   - Uso consistente de `dip` (Density-Independent Pixels), alvos acionáveis de pelo menos 48dp e cálculo dinâmico da escala (`Main.sc`).
   - `android:windowSoftInputMode="stateHidden|adjustPan"` no manifesto para impedir que o teclado virtual desconfigure os painéis.
   - A Activity usa somente sua área útil de conteúdo; nenhum componente depende da biblioteca IME ou de permissões de runtime para layout.
2. **Design Visual "Ultra-Premium"**:
   - Estética inspirada no AeroCalculator, com temas Light/Dark equivalentes em hierarquia, legibilidade e contraste; mudança de tema deve preservar estado e funcionalidade.
   - Tipografia técnica límpida e legível (`xenara-bold.ttf` / fontes do sistema).
   - Feedback tátil e visual instantâneo a cada alteração de parâmetro.
   - Popups contextuais elegantes e intuitivos para esclarecer parâmetros complexos (ex: modelos de influxo, correção de ponta, perfis aerodinâmicos).

---

## 4. Gestão de Chaves, Keystore e Google Play

1. **Credenciais fora do repositório**:
   - Keystores, chaves PEPK, senhas e service accounts nunca pertencem ao Git, mesmo em repositórios privados.
   - Builds locais usam `B4A_KEY_FILE`, `B4A_KEY_PASSWORD` e, opcionalmente, `B4A_KEY_ALIAS`. Sem essas variáveis, `tools/b4a_build.ps1` produz uma build não assinada.
   - Materiais de publicação devem permanecer em um cofre de segredos ou armazenamento privado separado; Base64 não é criptografia nem mecanismo de proteção.
   - Qualquer credencial que tenha sido historicamente versionada deve ser considerada exposta e rotacionada no provedor correspondente.
2. **Publicação na Play Store**:
   - Sempre incrementar `#VersionCode` (inteiro estritamente crescente) e atualizar `#VersionName` antes de gerar pacotes de release.
   - Gerar pacotes assinados `.aab` (*Android App Bundle*) direcionados ao SDK 36 (Android 16), com compatibilidade retroativa para Android 7.0+ (API 24+).

---

## 5. Fluxo de Validação e Testes

Antes de concluir qualquer entrega de desenvolvimento:
1. Executar o script de teste de consistência física (`python tools/verify_engine.py`).
2. Executar a matriz Python de referência e os contratos de fonte B4A. Equivalência numérica B4A↔Python só pode ser declarada após executar o motor B4A compilado; inspeção de fonte não substitui esse gate.
3. Garantir compilação limpa do projeto B4A sem erros ou avisos de referência nula.
4. Manter a documentação em `plano.md` e `docs/` rigorosamente atualizada.

---

## 6. Frontend Android e QA de Release

- A navegação principal usa três painéis B4A nativos (`Geometry`, `Conditions`, `Results`) controlados pelas tabs do header; `AHViewPager` não faz parte do runtime atual.
- As bibliotecas B4A declaradas são `core`, `phone` e `JavaObject`; JavaObject é restrito à integração Android necessária para exportação SAF.
- O manifesto suporta Android 7.0+ (`minSdkVersion=24`) e usa `targetSdkVersion=36`.
- Em Geometry e Conditions, o padrão visual segue o AeroCalculator: a coluna esquerda é uma superfície acionável de label/ajuda, a coluna central é o valor, e a coluna direita é uma superfície acionável de unidade. Trocar unidade altera apenas apresentação/conversão; o engine permanece em SI.
- `Target Thrust` e `Target CT` são mutuamente exclusivos na UI quando o trim coletivo está ativo.
- Horizontal Flow deve oferecer μ/Vx como representações alternativas. Axial Flow deve oferecer α/Vz/μz como representações alternativas; é proibido somá-las. A convenção é +Vz/+μz para baixo e α>0 para escoamento chegando de baixo.
- Settings Light/Dark, SI/Imperial e +1 Decimal devem persistir. Sweep deve oferecer eixo μ/Vx, legendas fora da área de dados e export CSV/PNG via Storage Access Framework sem permissão ampla de armazenamento.
- `RotorGeometry` e `FlightCondition` são custom `Type` B4A e portanto objetos por referência. Qualquer rotina temporária de cálculo, trim, sweep ou duplicação deve usar `zBETEngine.CloneGeometry` / `CloneCondition` antes de modificar campos; cálculos não podem alterar silenciosamente o estado do chamador.
- Tip-loss deve representar explicitamente `none`, `fixed` e `sissingh`; presets com fator fixo não podem ser apresentados como OFF.
- Antes de uma entrega final, a validação deve ser executada localmente: testes zBET, compilação B4A real, instalação do APK em emulador/dispositivo, nove configurações alvo, smoke tests de interação e inspeção das screenshots reais. O workflow GitHub é manual e auxiliar; não promove binários nem substitui a validação local.


## 7. Gestão de Rotores na UI

- O header global não deve exibir o nome do rotor ativo.
- Geometry abre diretamente no editor completo; não existe etapa obrigatória de biblioteca/popup antes de editar.
- No topo de Geometry, uma barra persistente mostra o rotor ativo. Tocar nessa barra abre a seleção de rotores salvos e a ação NEW ROTOR.
- SAVE, COPY e DELETE ficam disponíveis na própria página Geometry. SAVE não fecha nem troca de tela.
- O editor usa um grid rígido e comum com Conditions: **label / valor / unidade**, com as três colunas alinhadas em todas as linhas.
- Labels de Geometry e Conditions são superfícies tocáveis para ajuda ou seleção contextual; unidades são superfícies tocáveis para seleção quando houver conversões válidas.
- Horizontal Flow usa um único botão de variável para alternar **μ / Vx**. Axial Flow usa um único botão de variável para alternar **α / Vz / μz**.
- A seleção do rotor ativo deve persistir entre cold restarts, e edições não salvas devem sobreviver à recriação normal da Activity.

## 8. Binding visual design system

- **AeroCalculator is the interaction reference, not a pixel-for-pixel skin.** RotorCalculator shall inherit its disciplined engineering grammar and may modernize color, spacing, hierarchy, and responsive behavior.
- Geometry and Conditions use one canonical row geometry: **label button | value | unit button**. The three column edges, control heights, and vertical centers are shared across all normal rows.
- A clickable row label is a real B4A `Button`, not a `Label` painted to resemble one. A clickable unit is also a real `Button`. This guarantees consistent pressed-state feedback, focus behavior, accessibility semantics, and touch behavior.
- Selector rows use the same three-column geometry. When a selector has no physical unit, the unit column remains present with a neutral non-converting unit control so the page grid never shifts.
- Derived/read-only quantities preserve the same columns but the center value is visually read-only and must not resemble an editable `EditText`.
- Results use their own strict three-column presentation: **symbol-first quantity | value | unit**. Units are never concatenated into the numerical value string. Result rows are read-only and visually distinct from input rows.
- One canonical engineering name is stored for every quantity. Legacy strings such as `Thrust Coef (CT)` or `Induced Factor Kind` shall not be used as hidden UI source names and translated later. Geometry, Conditions, Results, plots, help, tests and exports shall use the same canonical symbols.
- Responsive naming has three levels: **symbol/very compact** on narrow phones, **compact engineering name** on ordinary phones, and **full engineering name** where width permits. The physical symbol must not change between levels.
- Visual hierarchy is deliberate: active rotor / primary action > section heading > editable/selectable row > derived/read-only row > secondary status. Small caption typography is not allowed for information that affects engineering interpretation.
- Normal engineering text shall target approximately 15–16 sp on phones. Section headings and status text shall remain clearly readable and shall not be reduced to 10–11 sp simply to fit more content.
- The UI may scroll vertically rather than shrinking text or compressing touch targets. Minimum interactive height remains approximately 48 dp.
- Visual release review shall inspect at least 320, 360, 393, 412, 600 and 768 dp portrait widths plus representative phone/tablet landscape, including 130% font scale. Source inspection alone is not a visual pass.

## Release artifact hygiene

- The source target is currently RotorCalculator 1.23 (versionCode 6).
- Do not keep an APK or AAB in the repository if it was built from an older source revision.
- A release APK/AAB may be committed only after the exact source commit is compiled locally, installed, operated, and visually reviewed.
- GitHub Actions is not the release authority and must not auto-promote binaries.
