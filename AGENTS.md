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
   - (3) Requisitos de software em `docs/software_requirements.md`;
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
- Gerenciamento autônomo das geometrias salvas no armazenamento seguro do app (`RuntimePermissions.GetSafeDirDefaultExternal("")` ou `File.DirInternal`).
- Suporte a presets de fábrica (UH-60, Bell 206, Bo 105, R44, DJI Drone) e criação ilimitada de rotores customizados com operações completas de CRUD (Criar, Ler, Atualizar, Duplicar, Deletar).

---

## 3. Padrões de Interface Humana e Compatibilidade Android

1. **Responsividade Universal**:
   - Deve funcionar perfeitamente em telas compactas (320dp de largura), telas comuns (360dp a 412dp), dobráveis e tablets (600dp+).
   - Uso consistente de `dip` (Density-Independent Pixels) e cálculo dinâmico da escala (`Main.sc`).
   - `android:windowSoftInputMode="stateHidden|adjustPan"` no manifesto para impedir que o teclado virtual desconfigure os painéis.
   - Suporte estrito às áreas seguras (*edge-to-edge* e barras de sistema) via `IME.GetContentRect`.
2. **Design Visual "Ultra-Premium"**:
   - Estética inspirada no AeroCalculator, porém com acabamento moderno de instrumentos aeronáuticos e estilo *high-tech* (paleta escura em grafite/titânio com destaques em ciano elétrico `#00E5FF`, verde esmeralda `#00E676`, e branco puro).
   - Tipografia técnica límpida e legível (`xenara-bold.ttf` / fontes do sistema).
   - Feedback tátil e visual instantâneo a cada alteração de parâmetro.
   - Popups contextuais elegantes e intuitivos para esclarecer parâmetros complexos (ex: modelos de influxo, correção de ponta, perfis aerodinâmicos).

---

## 4. Gestão de Chaves, Keystore e Google Play

1. **Diretório `Key/`**:
   - O diretório `Key/` contém a keystore oficial (`key_aero_calc.keystore`, alias `b4a`, senha `81xadrez`) e as credenciais de API (`play_store_service_account.json`).
   - **Confidencialidade Máxima**: Nenhum arquivo privado ou senha deve ser commitado em repositórios públicos.
   - Para backups na nuvem, utilizar o formato codificado em Base64 (`key_aero_calc.keystore.b64.txt`).
2. **Publicação na Play Store**:
   - Sempre incrementar `#VersionCode` (inteiro estritamente crescente) e atualizar `#VersionName` antes de gerar pacotes de release.
   - Gerar pacotes assinados `.aab` (*Android App Bundle*) direcionados ao SDK 36 (Android 16), mantendo compatibilidade retroativa até Android 5.0 (API 16/21).

---

## 5. Fluxo de Validação e Testes

Antes de concluir qualquer entrega de desenvolvimento:
1. Executar o script de teste de consistência física (`python tools/verify_engine.py`).
2. Verificar que as tolerâncias numéricas entre o motor B4A e o zBET de referência respeitam os limites ($\Delta C_T < 10^{-6}$, $\Delta \lambda_i < 10^{-6}$, $\Delta C_Q < 10^{-5}$).
3. Garantir compilação limpa do projeto B4A sem erros ou avisos de referência nula.
4. Manter a documentação em `plano.md` e `docs/` rigorosamente atualizada.
