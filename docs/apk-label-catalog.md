# Catálogo completo de labels e botões do APK

Tabela extraída das fontes B4A. Não utiliza o emulador nem altera a versão web.

- Results: **5 níveis** — L completo, M curto, A abreviado, S estreito, mínimo somente símbolo. S permite remover “Force” antes de chegar ao símbolo.
- Labels de Geometry/Conditions: **5 slots legados** — L, M, A, S, mínimo; S permite nomes mais curtos com símbolo. Os níveis podem ter textos iguais.
- Controles sem símbolo mantêm um caption curto no nível mínimo; um botão de ação não pode virar vazio.
- Botões de ação, valores de seletores, menus, headings e mensagens possuem captions fixos ou templates; não têm quatro versões responsivas. A repetição nas colunas abaixo registra esse fato.
- O símbolo vem **depois do nome**. Marcadores `_`/`_{...}` são renderizados como subscritos matemáticos no APK.
- `↵` registra uma quebra explícita já existente no controle; não é um modo de abreviação.
- Nomes e valores personalizados são templates: não existe uma lista finita de nomes de rotores ou valores numéricos.
- Parte da nomenclatura é utilizada no help ou em opções; não é necessariamente o texto do botão visível. Os captions reais desses botões também estão inventariados.
- A revisão dos nomes é documental nesta entrega. Testes em emulador só serão realizados mediante pedido explícito do usuário.


| Área / uso | Chave / controle | Sistema | Completo L | Curto M | Abreviado A | Estreito S | Mínimo | Fonte |
|---|---|---|---|---|---|---|---|---|
| Opções / ações / help | name | Canônico | Rotor Name | Name | Name | Name | Name | RotorNames.bas |
| Geometry | R | Canônico | Rotor Radius R | Radius R | Radius R | Radius R | R | RotorNames.bas |
| Geometry | Nb | Canônico | Blade Count N_b | Blades N_b | Blades N_b | Blades N_b | N_b | RotorNames.bas |
| Geometry | x0 | Canônico | Root Cutout x_0 | Root Cutout x_0 | Root Cutout x_0 | Root Cutout x_0 | x_0 | RotorNames.bas |
| Geometry | c0 | Canônico | Root Chord c_R | Root Chord c_R | Root Chord c_R | Root Chord c_R | c_R | RotorNames.bas |
| Geometry | c1 | Canônico | Tip Chord c_T | Tip Chord c_T | Tip Chord c_T | Tip Chord c_T | c_T | RotorNames.bas |
| Geometry | taper | Canônico | Taper Ratio c_T/c_R | Taper c_T/c_R | Taper c_T/c_R | Taper c_T/c_R | c_T/c_R | RotorNames.bas |
| Geometry | sigmaRef | Canônico | Reference Solidity σ_REF | Reference Solidity σ_REF | Ref. Solidity σ_REF | Ref. Solidity σ_REF | σ_REF | RotorNames.bas |
| Geometry | sigmaAct | Canônico | Actual Solidity σ_act | Actual Solidity σ_act | Act. Solidity σ_act | Act. Solidity σ_act | σ_act | RotorNames.bas |
| Geometry | sigmaT | Canônico | Thrust-Weighted Solidity σ_TR | Thrust Solidity σ_TR | Thr. Solidity σ_TR | Thr. Solidity σ_TR | σ_TR | RotorNames.bas |
| Geometry | AR | Canônico | Aspect Ratio AR | Aspect Ratio AR | Aspect AR | Aspect AR | AR | RotorNames.bas |
| Geometry | A | Canônico | Disk Area A | Disk Area A | Disk Area A | Disk Area A | A | RotorNames.bas |
| Geometry | Ab | Canônico | Reference Blade Area A_REF | Reference Area A_REF | Ref. Area A_REF | Ref. Area A_REF | A_REF | RotorNames.bas |
| Geometry | Aact | Canônico | Actual Blade Area A_act | Actual Area A_act | Act. Area A_act | Act. Area A_act | A_act | RotorNames.bas |
| Geometry | thRoot | Canônico | Root Pitch θ_R | Root Pitch θ_R | Root Pitch θ_R | Root Pitch θ_R | θ_R | RotorNames.bas |
| Geometry | thTip | Canônico | Tip Pitch θ_T | Tip Pitch θ_T | Tip Pitch θ_T | Tip Pitch θ_T | θ_T | RotorNames.bas |
| Geometry | thTwist | Canônico | Total Blade Twist θ_twist | Twist θ_twist | Twist θ_twist | Twist θ_twist | θ_twist | RotorNames.bas |
| Opções / ações / help | th75 | Canônico | Three-Quarter Pitch θ_75 | Pitch 75% θ_75 | Pitch 75% θ_75 | Pitch 75% θ_75 | θ_75 | RotorNames.bas |
| Geometry | airfoil | Canônico | Airfoil Section | Airfoil | Airfoil | Airfoil | Airfoil | RotorNames.bas |
| Geometry | a0 | Canônico | Lift-Curve Slope a_0 | Lift Slope a_0 | Lift Slope a_0 | Lift Slope a_0 | a_0 | RotorNames.bas |
| Geometry | Cd0 | Canônico | Profile Drag Coefficient C_d0 | Profile Drag C_d0 | Prof. Drag C_d0 | Prof. Drag C_d0 | C_d0 | RotorNames.bas |
| Geometry | tipModel | Canônico | Tip-Loss Model | Tip Loss | Tip Loss | Tip Loss | Tip Loss | RotorNames.bas |
| Geometry | B | Canônico | Tip-Loss Factor B | Tip Factor B | Tip Factor B | Tip Factor B | B | RotorNames.bas |
| Geometry | comp | Canônico | Compressibility Correction | Compressibility | Compres. | Compres. | Comp. | RotorNames.bas |
| Geometry | rpmNom | Canônico | Rotor Speed Ω_nom | Rotor Speed Ω_nom | Rot. Speed Ω_nom | Rot. Speed Ω_nom | Ω_nom | RotorNames.bas |
| Conditions / Results | h | Canônico | Pressure Altitude h | Altitude h | Altitude h | Altitude h | h | RotorNames.bas |
| Conditions / Results | T0 | Canônico | Ambient Temperature T_amb | Temperature T_amb | Temperature T_amb | Temp. T_amb | T_amb | RotorNames.bas |
| Conditions / Results | mu | Canônico | Advance Ratio μ_x | Advance Ratio μ_x | Adv. Ratio μ_x | Adv. Ratio μ_x | μ_x | RotorNames.bas |
| Conditions / Results | Vx | Canônico | Forward Airspeed V_x | Airspeed V_x | Airspeed V_x | Airspeed V_x | V_x | RotorNames.bas |
| Conditions / Results | alpha | Canônico | Disk Angle of Attack α | Disk AoA α | Disk AoA α | Disk AoA α | α | RotorNames.bas |
| Conditions / Results | Vz | Canônico | Climb Speed V_z | Climb Speed V_z | Climb Speed V_z | Climb Speed V_z | V_z | RotorNames.bas |
| Conditions / Results | muz | Canônico | Axial Flow Ratio μ_z | Axial Ratio μ_z | Axial Ratio μ_z | Axial Ratio μ_z | μ_z | RotorNames.bas |
| Conditions | trim | Canônico | Trim Mode | Trim | Trim | Trim | Trim | RotorNames.bas |
| Conditions / Results | rpm | Canônico | Rotor Speed Ω | Rotor Speed Ω | Rot. Speed Ω | Rot. Speed Ω | Ω | RotorNames.bas |
| Conditions / Results | coll | Canônico | Collective Pitch Δθ | Collective Δθ | Collective Δθ | Collective Δθ | Δθ | RotorNames.bas |
| Conditions | Ttgt | Canônico | Target Thrust T | Target Thrust T | Target Thrust T | Target Thrust T | T | RotorNames.bas |
| Conditions | CTtgt | Canônico | Target Thrust Coefficient C_T | Target C_T | Target C_T | Target C_T | C_T | RotorNames.bas |
| Conditions | inflow | Canônico | Inflow Model | Inflow | Inflow | Inflow | Inflow | RotorNames.bas |
| Conditions | kind | Canônico | Induced Power Factor k_ind | Induced Factor k_ind | Ind. Factor k_ind | Ind. Factor k_ind | k_ind | RotorNames.bas |
| Conditions | drag | Canônico | Profile Drag Integration | Drag Integration | Integration | Integration | Integ. | RotorNames.bas |
| Results | T | Canônico | Thrust T | Thrust T | Thrust T | Thrust T | T | RotorNames.bas |
| Results | P | Canônico | Shaft Power P | Power P | Power P | Power P | P | RotorNames.bas |
| Results | Pi | Canônico | Induced Power P_i | Induced Power P_i | Ind. Power P_i | Ind. Power P_i | P_i | RotorNames.bas |
| Results | P0 | Canônico | Profile Power P_0 | Profile Power P_0 | Prof. Power P_0 | Prof. Power P_0 | P_0 | RotorNames.bas |
| Results | Q | Canônico | Shaft Torque Q | Torque Q | Torque Q | Torque Q | Q | RotorNames.bas |
| Results | H | Canônico | In-Plane Force H | In-Plane Force H | In-Plane Force H | In-Plane Force H | H | RotorNames.bas |
| Results | Y | Canônico | Side Force Y | Side Force Y | Side Force Y | Side Force Y | Y | RotorNames.bas |
| Results | Mx | Canônico | Roll Moment M_x | Roll Moment M_x | Roll Moment M_x | Roll Moment M_x | M_x | RotorNames.bas |
| Results | My | Canônico | Pitch Moment M_y | Pitch Moment M_y | Pitch Moment M_y | Pitch Moment M_y | M_y | RotorNames.bas |
| Results | DL | Canônico | Disk Loading T/A | Disk Loading T/A | Disk Loading T/A | Disk Loading T/A | T/A | RotorNames.bas |
| Results | PL | Canônico | Power Loading T/P | Power Loading T/P | Power Loading T/P | Power Loading T/P | T/P | RotorNames.bas |
| Results | Vztot | Canônico | Total Axial Speed V_{z,tot} | Total Axial Speed V_{z,tot} | Axial Speed V_{z,tot} | Axial Speed V_{z,tot} | V_{z,tot} | RotorNames.bas |
| Results | Vadv | Canônico | Advancing Speed V_adv | Advancing Speed V_adv | Adv. Speed V_adv | Adv. Speed V_adv | V_adv | RotorNames.bas |
| Results | Vret | Canônico | Retreating Speed V_ret | Retreating Speed V_ret | Ret. Speed V_ret | Ret. Speed V_ret | V_ret | RotorNames.bas |
| Results | Mret | Canônico | Retreating Mach M_ret | Retreating Mach M_ret | Ret. Mach M_ret | Ret. Mach M_ret | M_ret | RotorNames.bas |
| Results | aoaAdv25 | Canônico | Advancing AoA 25% α_{adv,25} | Adv. AoA 25% α_{adv,25} | Adv. AoA 25 α_{adv,25} | Adv. AoA 25 α_{adv,25} | α_{adv,25} | RotorNames.bas |
| Results | aoaRet25 | Canônico | Retreating AoA 25% α_{ret,25} | Ret. AoA 25% α_{ret,25} | Ret. AoA 25 α_{ret,25} | Ret. AoA 25 α_{ret,25} | α_{ret,25} | RotorNames.bas |
| Results | phiAdv25 | Canônico | Advancing Inflow Angle 25% φ_{adv,25} | Adv. Inflow 25% φ_{adv,25} | Adv. Inflow 25 φ_{adv,25} | Adv. Inflow 25 φ_{adv,25} | φ_{adv,25} | RotorNames.bas |
| Results | phiRet25 | Canônico | Retreating Inflow Angle 25% φ_{ret,25} | Ret. Inflow 25% φ_{ret,25} | Ret. Inflow 25 φ_{ret,25} | Ret. Inflow 25 φ_{ret,25} | φ_{ret,25} | RotorNames.bas |
| Results | aoaAdv50 | Canônico | Advancing AoA 50% α_{adv,50} | Adv. AoA 50% α_{adv,50} | Adv. AoA 50 α_{adv,50} | Adv. AoA 50 α_{adv,50} | α_{adv,50} | RotorNames.bas |
| Results | aoaRet50 | Canônico | Retreating AoA 50% α_{ret,50} | Ret. AoA 50% α_{ret,50} | Ret. AoA 50 α_{ret,50} | Ret. AoA 50 α_{ret,50} | α_{ret,50} | RotorNames.bas |
| Results | phiAdv50 | Canônico | Advancing Inflow Angle 50% φ_{adv,50} | Adv. Inflow 50% φ_{adv,50} | Adv. Inflow 50 φ_{adv,50} | Adv. Inflow 50 φ_{adv,50} | φ_{adv,50} | RotorNames.bas |
| Results | phiRet50 | Canônico | Retreating Inflow Angle 50% φ_{ret,50} | Ret. Inflow 50% φ_{ret,50} | Ret. Inflow 50 φ_{ret,50} | Ret. Inflow 50 φ_{ret,50} | φ_{ret,50} | RotorNames.bas |
| Results | aoaAdv75 | Canônico | Advancing AoA 75% α_{adv,75} | Adv. AoA 75% α_{adv,75} | Adv. AoA 75 α_{adv,75} | Adv. AoA 75 α_{adv,75} | α_{adv,75} | RotorNames.bas |
| Results | aoaRet75 | Canônico | Retreating AoA 75% α_{ret,75} | Ret. AoA 75% α_{ret,75} | Ret. AoA 75 α_{ret,75} | Ret. AoA 75 α_{ret,75} | α_{ret,75} | RotorNames.bas |
| Results | phiAdv75 | Canônico | Advancing Inflow Angle 75% φ_{adv,75} | Adv. Inflow 75% φ_{adv,75} | Adv. Inflow 75 φ_{adv,75} | Adv. Inflow 75 φ_{adv,75} | φ_{adv,75} | RotorNames.bas |
| Results | phiRet75 | Canônico | Retreating Inflow Angle 75% φ_{ret,75} | Ret. Inflow 75% φ_{ret,75} | Ret. Inflow 75 φ_{ret,75} | Ret. Inflow 75 φ_{ret,75} | φ_{ret,75} | RotorNames.bas |
| Results | aoaAdvTip | Canônico | Advancing AoA Tip α_{adv,tip} | Adv. AoA Tip α_{adv,tip} | Adv. AoA Tip α_{adv,tip} | Adv. AoA Tip α_{adv,tip} | α_{adv,tip} | RotorNames.bas |
| Results | aoaRetTip | Canônico | Retreating AoA Tip α_{ret,tip} | Ret. AoA Tip α_{ret,tip} | Ret. AoA Tip α_{ret,tip} | Ret. AoA Tip α_{ret,tip} | α_{ret,tip} | RotorNames.bas |
| Results | phiAdvTip | Canônico | Advancing Inflow Angle Tip φ_{adv,tip} | Adv. Inflow Tip φ_{adv,tip} | Adv. Inflow Tip φ_{adv,tip} | Adv. Inflow Tip φ_{adv,tip} | φ_{adv,tip} | RotorNames.bas |
| Results | phiRetTip | Canônico | Retreating Inflow Angle Tip φ_{ret,tip} | Ret. Inflow Tip φ_{ret,tip} | Ret. Inflow Tip φ_{ret,tip} | Ret. Inflow Tip φ_{ret,tip} | φ_{ret,tip} | RotorNames.bas |
| Results | vi | Canônico | Induced Speed V_i | Induced Speed V_i | Ind. Speed V_i | Ind. Speed V_i | V_i | RotorNames.bas |
| Results | CT | Canônico | Thrust Coefficient C_T | Thrust Coeff. C_T | Thrust C_T | Thrust C_T | C_T | RotorNames.bas |
| Results | CQ | Canônico | Torque Coefficient C_Q | Torque Coeff. C_Q | Torque C_Q | Torque C_Q | C_Q | RotorNames.bas |
| Results | CQi | Canônico | Induced Torque Coefficient C_Qi | Ind. Torque Coeff. C_Qi | Ind. Torque C_Qi | Ind. Torque C_Qi | C_Qi | RotorNames.bas |
| Results | Qi | Canônico | Induced Torque Q_i | Induced Torque Q_i | Ind. Torque Q_i | Ind. Torque Q_i | Q_i | RotorNames.bas |
| Results | Q0 | Canônico | Profile Torque Q_0 | Profile Torque Q_0 | Prof. Torque Q_0 | Prof. Torque Q_0 | Q_0 | RotorNames.bas |
| Results | Hi | Canônico | Induced In-Plane Force H_i | Induced In-Plane Force H_i | Ind. In-Plane Force H_i | Ind. In-Plane H_i | H_i | RotorNames.bas |
| Results | H0 | Canônico | Profile In-Plane Force H_0 | Profile In-Plane Force H_0 | Prof. In-Plane Force H_0 | Prof. In-Plane H_0 | H_0 | RotorNames.bas |
| Results | Pair | Canônico | Air Power P_air | Air Power P_air | Air Power P_air | Air Power P_air | P_air | RotorNames.bas |
| Results | CQ0 | Canônico | Profile Torque Coefficient C_Q0 | Prof. Torque Coeff. C_Q0 | Prof. Torque C_Q0 | Prof. Torque C_Q0 | C_Q0 | RotorNames.bas |
| Results | CH | Canônico | In-Plane Force Coefficient C_H | In-Plane Coeff. C_H | In-Plane C_H | In-Plane C_H | C_H | RotorNames.bas |
| Results | CHi | Canônico | Induced In-Plane Force Coefficient C_Hi | Ind. In-Plane Coeff. C_Hi | Ind. In-Plane C_Hi | Ind. In-Plane C_Hi | C_Hi | RotorNames.bas |
| Results | CH0 | Canônico | Profile In-Plane Force Coefficient C_H0 | Prof. In-Plane Coeff. C_H0 | Prof. In-Plane C_H0 | Prof. In-Plane C_H0 | C_H0 | RotorNames.bas |
| Results | CY | Canônico | Side Force Coefficient C_Y | Side Force C_Y | Side Force C_Y | Side Force C_Y | C_Y | RotorNames.bas |
| Results | CMx | Canônico | Roll Moment Coefficient C_Mx | Roll Moment C_Mx | Roll Moment C_Mx | Roll Moment C_Mx | C_Mx | RotorNames.bas |
| Results | CMy | Canônico | Pitch Moment Coefficient C_My | Pitch Moment C_My | Pitch Moment C_My | Pitch Moment C_My | C_My | RotorNames.bas |
| Results | CPair | Canônico | Air Power Coefficient C_Pair | Air Power C_Pair | Air Power C_Pair | Air Power C_Pair | C_Pair | RotorNames.bas |
| Results | CTs | Canônico | Blade Loading C_T/σ_TR | Blade Loading C_T/σ_TR | Blade Load C_T/σ_TR | Blade Load C_T/σ_TR | C_T/σ_TR | RotorNames.bas |
| Results | CLbar | Canônico | Mean Lift Coefficient C̄_L | Mean Lift Coefficient C̄_L | Mean Lift C̄_L | Mean Lift C̄_L | C̄_L | RotorNames.bas |
| Results | FM | Canônico | Figure of Merit (hover only) FM | Figure of Merit FM | FM | FM | FM | RotorNames.bas |
| Results | LDe | Canônico | Effective Lift/Drag Ratio (L/D)_e | Eff. Lift/Drag (L/D)_e | Eff. L/D (L/D)_e | Eff. L/D (L/D)_e | (L/D)_e | RotorNames.bas |
| Results | lam | Canônico | Total Inflow Ratio λ | Inflow Ratio λ | Inflow Ratio λ | Inflow Ratio λ | λ | RotorNames.bas |
| Results | lami | Canônico | Induced Inflow Ratio λ_i | Induced Inflow λ_i | Ind. Inflow λ_i | Ind. Inflow λ_i | λ_i | RotorNames.bas |
| Results | lamh | Canônico | Hover Inflow Ratio λ_h | Hover Inflow λ_h | Hover Inflow λ_h | Hover Inflow λ_h | λ_h | RotorNames.bas |
| Results | muLam | Canônico | Advance-to-Inflow Ratio μ/λ | Advance/Inflow μ/λ | Advance/Inflow μ/λ | Advance/Inflow μ/λ | μ/λ | RotorNames.bas |
| Results | Tc | Canônico | Dynamic Thrust Coefficient T_c | Dynamic Thrust Coeff T_c | Dyn Thrust Coeff T_c | Dyn Thrust Coeff T_c | T_c | RotorNames.bas |
| Results | Pc | Canônico | Dynamic Power Coefficient P_c | Dynamic Power Coeff P_c | Dyn Power Coeff P_c | Dyn Power Coeff P_c | P_c | RotorNames.bas |
| Results | Kx | Canônico | Longitudinal Inflow Gradient K_x | Long. Gradient K_x | Long. Gradient K_x | Long. Gradient K_x | K_x | RotorNames.bas |
| Results | Ky | Canônico | Lateral Inflow Gradient K_y | Lat. Gradient K_y | Lat. Gradient K_y | Lat. Gradient K_y | K_y | RotorNames.bas |
| Results | chi | Canônico | Wake Skew Angle χ | Wake Skew χ | Wake Skew χ | Wake Skew χ | χ | RotorNames.bas |
| Results | Bres | Canônico | Tip-Loss Factor B | Tip Factor B | Tip Factor B | Tip Factor B | B | RotorNames.bas |
| Results | OmR | Canônico | Tip Speed ΩR | Tip Speed ΩR | Tip Speed ΩR | Tip Speed ΩR | ΩR | RotorNames.bas |
| Results | Mtip | Canônico | Tip Mach M_tip | Tip Mach M_tip | Tip Mach M_tip | Tip Mach M_tip | M_tip | RotorNames.bas |
| Results | Madv | Canônico | Advancing Tip Mach M_adv | Adv. Mach M_adv | Adv. Mach M_adv | Adv. Mach M_adv | M_adv | RotorNames.bas |
| Results | rho | Canônico | Air Density ρ | Density ρ | Density ρ | Density ρ | ρ | RotorNames.bas |
| Results | p | Canônico | Ambient Pressure p | Pressure p | Pressure p | Pressure p | p | RotorNames.bas |
| Results | a | Canônico | Speed of Sound a | Sound Speed a | Sound Speed a | Sound Speed a | a | RotorNames.bas |
| Opções / ações / help | tip_none | Canônico | Tip Loss None B | None B | None B | None B | B | RotorNames.bas |
| Opções / ações / help | tip_fixed | Canônico | Tip Loss Fixed B | Fixed B | Fixed B | Fixed B | B | RotorNames.bas |
| Opções / ações / help | tip_sissingh | Canônico | Tip Loss Sissingh B | Sissingh B | Sissingh B | Sissingh B | B | RotorNames.bas |
| Opções / ações / help | comp_off | Canônico | Compressibility Off | Off | Off | Off | Off | RotorNames.bas |
| Opções / ações / help | comp_pg | Canônico | Prandtl-Glauert | On | On | On | On | RotorNames.bas |
| Opções / ações / help | inflow_uniform | Canônico | Uniform Inflow | Uniform | Uniform | Uniform | Uniform | RotorNames.bas |
| Opções / ações / help | inflow_coleman_simple | Canônico | Coleman | Coleman | Coleman | Coleman | Coleman | RotorNames.bas |
| Opções / ações / help | inflow_coleman_feingold | Canônico | Coleman-Feingold (NDARC) | Coleman-FG | Coleman-FG | Coleman-FG | Coleman-FG | RotorNames.bas |
| Opções / ações / help | inflow_drees | Canônico | Drees | Drees | Drees | Drees | Drees | RotorNames.bas |
| Opções / ações / help | trim_none | Canônico | Trim None | None | None | None | None | RotorNames.bas |
| Opções / ações / help | trim_collective | Canônico | Trim Collective Δθ | Collective Δθ | Collective Δθ | Collective Δθ | Δθ | RotorNames.bas |
| Opções / ações / help | trim_rpm | Canônico | Trim Rotor Speed Ω | Rotor Speed Ω | Rotor Speed Ω | Rotor Speed Ω | Ω | RotorNames.bas |
| Opções / ações / help | rpm_collective | Canônico | Prescribe Speed & Collective Ω, Δθ | Ω + Δθ Ω, Δθ | Ω + Δθ Ω, Δθ | Ω + Δθ Ω, Δθ | Ω, Δθ | RotorNames.bas |
| Opções / ações / help | rpm_ct | Canônico | Prescribe Speed & Target C_T Ω, C_T | Ω + C_T Ω, C_T | Ω + C_T Ω, C_T | Ω + C_T Ω, C_T | Ω, C_T | RotorNames.bas |
| Opções / ações / help | rpm_thrust | Canônico | Prescribe Speed & Target Thrust Ω, T | Ω + T Ω, T | Ω + T Ω, T | Ω + T Ω, T | Ω, T | RotorNames.bas |
| Opções / ações / help | collective_ct | Canônico | Prescribe Collective & Target C_T Δθ, C_T | Δθ + C_T Δθ, C_T | Δθ + C_T Δθ, C_T | Δθ + C_T Δθ, C_T | Δθ, C_T | RotorNames.bas |
| Opções / ações / help | collective_thrust | Canônico | Prescribe Collective & Target Thrust Δθ, T | Δθ + T Δθ, T | Δθ + T Δθ, T | Δθ + T Δθ, T | Δθ, T | RotorNames.bas |
| Opções / ações / help | ct_thrust | Canônico | Prescribe Target C_T & Target Thrust C_T, T | C_T + T C_T, T | C_T + T C_T, T | C_T + T C_T, T | C_T, T | RotorNames.bas |
| Opções / ações / help | drag_tangential | Canônico | Analytical Tangential | Tangential | Tangential | Tangential | Tangential | RotorNames.bas |
| Opções / ações / help | drag_vectorial | Canônico | Analytical Vectorial | Vectorial | Vectorial | Vectorial | Vectorial | RotorNames.bas |
| Opções / ações / help | drag_numerical | Canônico | Numerical Vectorial | Num. Vec. | Num. Vec. | Num. Vec. | Num. Vec. | RotorNames.bas |
| Opções / ações / help | sw_none | Canônico | No Trim (Fixed Controls) | No Trim | No Trim | No Trim | No Trim | RotorNames.bas |
| Opções / ações / help | sw_coll_all | Canônico | Trim Collective Δθ · Every Point | Collective Every Point | Collective Every Point | Collective Every Point | Collective Every Point | RotorNames.bas |
| Opções / ações / help | sw_rpm_all | Canônico | Trim Rotor Speed Ω · Every Point | Speed Every Point | Speed Every Point | Speed Every Point | Speed Every Point | RotorNames.bas |
| Opções / ações / help | sw_coll_hover | Canônico | Trim Collective Δθ · Hover Only | Collective Hover Only | Collective Hover Only | Collective Hover Only | Collective Hover Only | RotorNames.bas |
| Opções / ações / help | sw_rpm_hover | Canônico | Trim Rotor Speed Ω · Hover Only | Speed Hover Only | Speed Hover Only | Speed Hover Only | Speed Hover Only | RotorNames.bas |
| Opções / ações / help | save | Canônico | Save Rotor | Save | Save | Save | Save | RotorNames.bas |
| Opções / ações / help | copy | Canônico | Copy Rotor | Copy | Copy | Copy | Copy | RotorNames.bas |
| Opções / ações / help | delete | Canônico | Delete Rotor | Delete | Delete | Delete | Delete | RotorNames.bas |
| Opções / ações / help | newRotor | Canônico | New Rotor | New | New | New | New | RotorNames.bas |
| Opções / ações / help | activeRotor | Canônico | Active Rotor | Active Rotor | Active Rotor | Active Rotor | Active Rotor | RotorNames.bas |
| Opções / ações / help | sweep | Canônico | Advance Ratio Sweep | Sweep | Sweep | Sweep | Sweep | RotorNames.bas |
| Opções / ações / help | table | Canônico | Sweep Table | Table | Table | Table | Table | RotorNames.bas |
| Opções / ações / help | csv | Canônico | Export CSV | CSV | CSV | CSV | CSV | RotorNames.bas |
| Opções / ações / help | png | Canônico | Export PNG | PNG | PNG | PNG | PNG | RotorNames.bas |
| Opções / ações / help | palette | Canônico | Plot Palette | Palette | Palette | Palette | Palette | RotorNames.bas |
| Opções / ações / help | sweepTrim | Canônico | Sweep Trim | Sweep Trim | Sweep Trim | Sweep Trim | Sweep Trim | RotorNames.bas |
| Opções / ações / help | xAxis | Canônico | Sweep Axis | Axis | Axis | Axis | Axis | RotorNames.bas |
| Opções / ações / help | xAxis_mu | Canônico | Advance Ratio μ_x | Advance Ratio μ_x | Advance Ratio μ_x | Advance Ratio μ_x | μ_x | RotorNames.bas |
| Opções / ações / help | xAxis_Vx | Canônico | Forward Airspeed V_x | Airspeed V_x | Airspeed V_x | Airspeed V_x | V_x | RotorNames.bas |
| Opções / ações / help | tabGeom | Canônico | Geometry Page | Geometry | Geometry | Geometry | Geometry | RotorNames.bas |
| Opções / ações / help | tabCond | Canônico | Conditions Page | Conditions | Conditions | Conditions | Conditions | RotorNames.bas |
| Opções / ações / help | tabRes | Canônico | Results Page | Results | Results | Results | Results | RotorNames.bas |
| Opções / ações / help | family | Canônico | Curve Family | Family | Family | Family | Family | RotorNames.bas |
| ConfirmExit | Dialog Title | Fixo | Unsaved Geometry | Unsaved Geometry | Unsaved Geometry | Não usado | Unsaved Geometry | RotorCalculator.b4a:468 |
| BuildUnifiedHeader | pnlMenuAnchor | Fixo | ⋮ | ⋮ | ⋮ | Não usado | ⋮ | RotorCalculator.b4a:581 |
| BuildUnifiedHeader | lblAppTitle | Fixo | RotorCalculator | RotorCalculator | RotorCalculator | Não usado | RotorCalculator | RotorCalculator.b4a:594 |
| BuildUnifiedHeader | btnTabGeom | Fixo | GEOMETRY | GEOMETRY | GEOMETRY | Não usado | GEOMETRY | RotorCalculator.b4a:619 |
| BuildUnifiedHeader | btnTabCond | Fixo | CONDITIONS | CONDITIONS | CONDITIONS | Não usado | CONDITIONS | RotorCalculator.b4a:631 |
| BuildUnifiedHeader | btnTabRes | Fixo | RESULTS | RESULTS | RESULTS | Não usado | RESULTS | RotorCalculator.b4a:643 |
| pnlMenuAnchor_Click | Option | Fixo | Physics & Equations | Physics & Equations | Physics & Equations | Não usado | Physics & Equations | RotorCalculator.b4a:670 |
| pnlMenuAnchor_Click | Option Help | Fixo | Theory, equations and notation | Theory, equations and notation | Theory, equations and notation | Não usado | Theory, equations and notation | RotorCalculator.b4a:670 |
| pnlMenuAnchor_Click | Option | Fixo | Unit Converter | Unit Converter | Unit Converter | Não usado | Unit Converter | RotorCalculator.b4a:671 |
| pnlMenuAnchor_Click | Option Help | Fixo | Quick engineering conversions | Quick engineering conversions | Quick engineering conversions | Não usado | Quick engineering conversions | RotorCalculator.b4a:671 |
| pnlMenuAnchor_Click | Option | Fixo | Settings | Settings | Settings | Não usado | Settings | RotorCalculator.b4a:672 |
| pnlMenuAnchor_Click | Option Help | Fixo | Display, plots and rotor data | Display, plots and rotor data | Display, plots and rotor data | Não usado | Display, plots and rotor data | RotorCalculator.b4a:672 |
| pnlMenuAnchor_Click | Option | Fixo | About | About | About | Não usado | About | RotorCalculator.b4a:673 |
| pnlMenuAnchor_Click | Option Help | Fixo | Version and credits | Version and credits | Version and credits | Não usado | Version and credits | RotorCalculator.b4a:673 |
| pnlMenuAnchor_Click | Option | Fixo | Privacy | Privacy | Privacy | Não usado | Privacy | RotorCalculator.b4a:674 |
| pnlMenuAnchor_Click | Option Help | Fixo | Privacy policy | Privacy policy | Privacy policy | Não usado | Privacy policy | RotorCalculator.b4a:674 |
| pnlMenuAnchor_Click | Dialog Title | Fixo | Menu | Menu | Menu | Não usado | Menu | RotorCalculator.b4a:675 |
| HandleMenuItem | Dialog Title | Fixo | About RotorCalculator | About RotorCalculator | About RotorCalculator | Não usado | About RotorCalculator | RotorCalculator.b4a:694 |
| OpenSettingsPopup | lblTitle | Fixo | SETTINGS | SETTINGS | SETTINGS | Não usado | SETTINGS | RotorCalculator.b4a:919 |
| OpenSettingsPopup | btnClose | Fixo | × | × | × | Não usado | × | RotorCalculator.b4a:928 |
| Settings | btnSettingTheme title | Fixo | Theme | Theme | Theme | Não usado | Theme | RotorCalculator.b4a:940 |
| Settings | btnSettingTheme subtitle | Fixo | Dark, Light or Midnight Blue | Dark, Light or Midnight Blue | Dark, Light or Midnight Blue | Não usado | Dark, Light or Midnight Blue | RotorCalculator.b4a:940 |
| Settings | btnSettingUnits title | Fixo | Result Units (Outputs Only) | Result Units (Outputs Only) | Result Units (Outputs Only) | Não usado | Result Units (Outputs Only) | RotorCalculator.b4a:942 |
| Settings | btnSettingUnits subtitle | Fixo | SI or Imperial for results; input rows keep their own units | SI or Imperial for results; input rows keep their own units | SI or Imperial for results; input rows keep their own units | Não usado | SI or Imperial for results; input rows keep their own units | RotorCalculator.b4a:942 |
| Settings | btnSettingPrecision title | Fixo | Number Format | Number Format | Number Format | Não usado | Number Format | RotorCalculator.b4a:944 |
| Settings | btnSettingPrecision subtitle | Fixo | Cycle between -1 decimal, standard, and +1 decimal | Cycle between -1 decimal, standard, and +1 decimal | Cycle between -1 decimal, standard, and +1 decimal | Não usado | Cycle between -1 decimal, standard, and +1 decimal | RotorCalculator.b4a:944 |
| Settings | btnSettingPalette title | Fixo | Palette | Palette | Palette | Não usado | Palette | RotorCalculator.b4a:947 |
| Settings | btnSettingPalette subtitle | Fixo | Sweep curve colors | Sweep curve colors | Sweep curve colors | Não usado | Sweep curve colors | RotorCalculator.b4a:947 |
| Settings | btnSettingImportGeometries title | Fixo | Import Geometries | Import Geometries | Import Geometries | Não usado | Import Geometries | RotorCalculator.b4a:950 |
| Settings | btnSettingImportGeometries subtitle | Fixo | Restore or merge a shared backup | Restore or merge a shared backup | Restore or merge a shared backup | Não usado | Restore or merge a shared backup | RotorCalculator.b4a:950 |
| Settings | btnSettingExportGeometries title | Fixo | Export Geometries | Export Geometries | Export Geometries | Não usado | Export Geometries | RotorCalculator.b4a:952 |
| Settings | btnSettingExportGeometries subtitle | Fixo | Backup all saved rotor geometries | Backup all saved rotor geometries | Backup all saved rotor geometries | Não usado | Backup all saved rotor geometries | RotorCalculator.b4a:952 |
| Settings | btnSettingRestore title | Fixo | Restore Factory Presets | Restore Factory Presets | Restore Factory Presets | Não usado | Restore Factory Presets | RotorCalculator.b4a:954 |
| Settings | btnSettingRestore subtitle | Fixo | Custom rotors are preserved | Custom rotors are preserved | Custom rotors are preserved | Não usado | Custom rotors are preserved | RotorCalculator.b4a:954 |
| AddSettingsRow | b | Fixo | RESTORE | RESTORE | RESTORE | Não usado | RESTORE | RotorCalculator.b4a:1013 |
| RefreshSettingsButtons | btnSettingPrecision | Fixo | +1 DECIMAL | +1 DECIMAL | +1 DECIMAL | Não usado | +1 DECIMAL | RotorCalculator.b4a:1042 |
| RefreshSettingsButtons | btnSettingPrecision | Fixo | -1 DECIMAL | -1 DECIMAL | -1 DECIMAL | Não usado | -1 DECIMAL | RotorCalculator.b4a:1044 |
| RefreshSettingsButtons | btnSettingPrecision | Fixo | STANDARD | STANDARD | STANDARD | Não usado | STANDARD | RotorCalculator.b4a:1046 |
| btnSettingTheme_Click | Option | Fixo | Dark | Dark | Dark | Não usado | Dark | RotorCalculator.b4a:1060 |
| btnSettingTheme_Click | Option Help | Fixo | Cockpit stealth, high contrast | Cockpit stealth, high contrast | Cockpit stealth, high contrast | Não usado | Cockpit stealth, high contrast | RotorCalculator.b4a:1060 |
| btnSettingTheme_Click | Option | Fixo | Light | Light | Light | Não usado | Light | RotorCalculator.b4a:1061 |
| btnSettingTheme_Click | Option Help | Fixo | Daylight, contrast tuned to 4.5:1 or better | Daylight, contrast tuned to 4.5:1 or better | Daylight, contrast tuned to 4.5:1 or better | Não usado | Daylight, contrast tuned to 4.5:1 or better | RotorCalculator.b4a:1061 |
| btnSettingTheme_Click | Option | Fixo | Midnight Blue | Midnight Blue | Midnight Blue | Não usado | Midnight Blue | RotorCalculator.b4a:1062 |
| btnSettingTheme_Click | Option Help | Fixo | Navy surfaces, cyan and amber accents | Navy surfaces, cyan and amber accents | Navy surfaces, cyan and amber accents | Não usado | Navy surfaces, cyan and amber accents | RotorCalculator.b4a:1062 |
| btnSettingTheme_Click | Option | Fixo | Sepia | Sepia | Sepia | Não usado | Sepia | RotorCalculator.b4a:1063 |
| btnSettingTheme_Click | Option Help | Fixo | Warm parchment, sober pastel tones | Warm parchment, sober pastel tones | Warm parchment, sober pastel tones | Não usado | Warm parchment, sober pastel tones | RotorCalculator.b4a:1063 |
| btnSettingTheme_Click | Dialog Title | Fixo | Theme | Theme | Theme | Não usado | Theme | RotorCalculator.b4a:1064 |
| btnSettingRestore_Click | Dialog Title | Fixo | Restore Factory Presets | Restore Factory Presets | Restore Factory Presets | Não usado | Restore Factory Presets | RotorCalculator.b4a:1119 |
| btnSettingExportGeometries_Click | Dialog Title | Fixo | Export Geometries | Export Geometries | Export Geometries | Não usado | Export Geometries | RotorCalculator.b4a:1133 |
| btnSettingImportGeometries_Click | Dialog Title | Fixo | Import Geometries | Import Geometries | Import Geometries | Não usado | Import Geometries | RotorCalculator.b4a:1173 |
| btnSettingImportGeometries_Click | Option | Fixo | Rename imported duplicates | Rename imported duplicates | Rename imported duplicates | Não usado | Rename imported duplicates | RotorCalculator.b4a:1192 |
| btnSettingImportGeometries_Click | Option Help | Fixo | Keep both rotors | Keep both rotors | Keep both rotors | Não usado | Keep both rotors | RotorCalculator.b4a:1192 |
| btnSettingImportGeometries_Click | Option | Fixo | Replace same-name local geometries | Replace same-name local geometries | Replace same-name local geometries | Não usado | Replace same-name local geometries | RotorCalculator.b4a:1193 |
| btnSettingImportGeometries_Click | Option Help | Fixo | Overwrite the local rotors | Overwrite the local rotors | Overwrite the local rotors | Não usado | Overwrite the local rotors | RotorCalculator.b4a:1193 |
| btnSettingImportGeometries_Click | Option | Fixo | Skip same-name imported geometries | Skip same-name imported geometries | Skip same-name imported geometries | Não usado | Skip same-name imported geometries | RotorCalculator.b4a:1194 |
| btnSettingImportGeometries_Click | Option Help | Fixo | Keep the local rotors | Keep the local rotors | Keep the local rotors | Não usado | Keep the local rotors | RotorCalculator.b4a:1194 |
| btnSettingImportGeometries_Click | Dialog Title | Fixo | Name Conflicts | Name Conflicts | Name Conflicts | Não usado | Name Conflicts | RotorCalculator.b4a:1195 |
| OpenHelpAsset | btnClose | Fixo | × | × | × | Não usado | × | RotorCalculator.b4a:1309 |
| OpenUnitConverter | lblTitle | Fixo | QUICK UNIT CONVERTER | QUICK UNIT CONVERTER | QUICK UNIT CONVERTER | Não usado | QUICK UNIT CONVERTER | RotorCalculator.b4a:1378 |
| OpenUnitConverter | btnClose | Fixo | × | × | × | Não usado | × | RotorCalculator.b4a:1387 |
| OpenUnitConverter | lblMode | Fixo | CONVERSION | CONVERSION | CONVERSION | Não usado | CONVERSION | RotorCalculator.b4a:1395 |
| btnUnitMode_Click | Dialog Title | Fixo | Quick Unit Converter | Quick Unit Converter | Quick Unit Converter | Não usado | Quick Unit Converter | RotorCalculator.b4a:1450 |
| UpdateUnitConversion | lblUnitFrom | Template | VALUE IN  ⟨conteúdo variável⟩ | VALUE IN  ⟨conteúdo variável⟩ | VALUE IN  ⟨conteúdo variável⟩ | Não usado | VALUE IN  ⟨conteúdo variável⟩ | RotorCalculator.b4a:1485 |
| BuildGeometryEditorContent | Section Header | Fixo | ROTOR | ROTOR | ROTOR | Não usado | ROTOR | RotorCalculator.b4a:2117 |
| BuildGeometryEditorContent | Section Header | Fixo | PLANFORM | PLANFORM | PLANFORM | Não usado | PLANFORM | RotorCalculator.b4a:2119 |
| BuildGeometryEditorContent | Section Header | Fixo | SOLIDITY & AREAS | SOLIDITY & AREAS | SOLIDITY & AREAS | Não usado | SOLIDITY & AREAS | RotorCalculator.b4a:2123 |
| BuildGeometryEditorContent | Section Header | Fixo | BLADE PITCH | BLADE PITCH | BLADE PITCH | Não usado | BLADE PITCH | RotorCalculator.b4a:2127 |
| BuildGeometryEditorContent | Section Header | Fixo | AERODYNAMICS | AERODYNAMICS | AERODYNAMICS | Não usado | AERODYNAMICS | RotorCalculator.b4a:2131 |
| AddActiveBar | lblUnsaved | Fixo | UNSAVED | UNSAVED | UNSAVED | Não usado | UNSAVED | RotorCalculator.b4a:2171 |
| Geometry | btnGeometrySave | Fixo | SAVE | SAVE | SAVE | Não usado | SAVE | RotorCalculator.b4a:2199 |
| Geometry | btnGeometryCopy | Fixo | COPY | COPY | COPY | Não usado | COPY | RotorCalculator.b4a:2200 |
| Geometry | btnGeometryDelete | Fixo | DELETE | DELETE | DELETE | Não usado | DELETE | RotorCalculator.b4a:2201 |
| RefreshCompressibilityButton | btnCompressibility | Fixo | On | On | On | Não usado | On | RotorCalculator.b4a:2295 |
| RefreshCompressibilityButton | btnCompressibility | Fixo | Off | Off | Off | Não usado | Off | RotorCalculator.b4a:2297 |
| btnSelectAirfoil_Click | Option | Fixo | Custom | Custom | Custom | Não usado | Custom | RotorCalculator.b4a:2422 |
| btnSelectAirfoil_Click | Option Help | Fixo | Keep a_0 and C_d0 as entered | Keep a_0 and C_d0 as entered | Keep a_0 and C_d0 as entered | Não usado | Keep a_0 and C_d0 as entered | RotorCalculator.b4a:2422 |
| btnCompressibility_Click | Option | Fixo | Off | Off | Off | Não usado | Off | RotorCalculator.b4a:2466 |
| btnCompressibility_Click | Option Help | Fixo | No compressibility correction | No compressibility correction | No compressibility correction | Não usado | No compressibility correction | RotorCalculator.b4a:2466 |
| btnCompressibility_Click | Option | Fixo | On | On | On | Não usado | On | RotorCalculator.b4a:2467 |
| btnCompressibility_Click | Option Help | Fixo | Prandtl-Glauert linear compressibility correction | Prandtl-Glauert linear compressibility correction | Prandtl-Glauert linear compressibility correction | Não usado | Prandtl-Glauert linear compressibility correction | RotorCalculator.b4a:2467 |
| RenameCurrentRotor | Dialog Title | Fixo | Rename Rotor | Rename Rotor | Rename Rotor | Não usado | Rename Rotor | RotorCalculator.b4a:2526 |
| ResolveUnsavedGeometry | Dialog Title | Fixo | Unsaved Geometry | Unsaved Geometry | Unsaved Geometry | Não usado | Unsaved Geometry | RotorCalculator.b4a:2573 |
| btnGeometryCopy_Click | Dialog Title | Fixo | Copy Rotor | Copy Rotor | Copy Rotor | Não usado | Copy Rotor | RotorCalculator.b4a:2597 |
| btnGeometryDelete_Click | Dialog Title | Fixo | Delete Rotor | Delete Rotor | Delete Rotor | Não usado | Delete Rotor | RotorCalculator.b4a:2612 |
| BuildPageCond | Section Header | Fixo | ATMOSPHERE & FLOW | ATMOSPHERE & FLOW | ATMOSPHERE & FLOW | Não usado | ATMOSPHERE & FLOW | RotorCalculator.b4a:2647 |
| BuildPageCond | Section Header | Fixo | OPERATING CONSTRAINTS | OPERATING CONSTRAINTS | OPERATING CONSTRAINTS | Não usado | OPERATING CONSTRAINTS | RotorCalculator.b4a:2660 |
| BuildPageCond | Section Header | Fixo | AERODYNAMIC MODEL | AERODYNAMIC MODEL | AERODYNAMIC MODEL | Não usado | AERODYNAMIC MODEL | RotorCalculator.b4a:2671 |
| BuildPageRes | btnViewPolarPlot | Fixo | OPEN PARAMETER SWEEP | OPEN PARAMETER SWEEP | OPEN PARAMETER SWEEP | Não usado | OPEN PARAMETER SWEEP | RotorCalculator.b4a:2698 |
| BuildPageRes | Section Header | Fixo | MODEL STATUS | MODEL STATUS | MODEL STATUS | Não usado | MODEL STATUS | RotorCalculator.b4a:2778 |
| lblResultStatus_Click | Dialog Title | Fixo | Prandtl-Glauert Invalid | Prandtl-Glauert Invalid | Prandtl-Glauert Invalid | Não usado | Prandtl-Glauert Invalid | RotorCalculator.b4a:2876 |
| lblResultStatus_Click | Dialog Title | Fixo | Model Status | Model Status | Model Status | Não usado | Model Status | RotorCalculator.b4a:2879 |
| lblResultStatus_Click | Dialog Title | Fixo | Compressibility Caution | Compressibility Caution | Compressibility Caution | Não usado | Compressibility Caution | RotorCalculator.b4a:2881 |
| btnOperatingPair_Click | Option | Fixo | Rotor Speed Ω + Collective Δθ | Rotor Speed Ω + Collective Δθ | Rotor Speed Ω + Collective Δθ | Não usado | Rotor Speed Ω + Collective Δθ | RotorCalculator.b4a:3691 |
| btnOperatingPair_Click | Option Help | Fixo | Solves C_T and T | Solves C_T and T | Solves C_T and T | Não usado | Solves C_T and T | RotorCalculator.b4a:3691 |
| btnOperatingPair_Click | Option | Fixo | Rotor Speed Ω + Target C_T | Rotor Speed Ω + Target C_T | Rotor Speed Ω + Target C_T | Não usado | Rotor Speed Ω + Target C_T | RotorCalculator.b4a:3692 |
| btnOperatingPair_Click | Option Help | Fixo | Solves Δθ and T | Solves Δθ and T | Solves Δθ and T | Não usado | Solves Δθ and T | RotorCalculator.b4a:3692 |
| btnOperatingPair_Click | Option | Fixo | Rotor Speed Ω + Target Thrust T | Rotor Speed Ω + Target Thrust T | Rotor Speed Ω + Target Thrust T | Não usado | Rotor Speed Ω + Target Thrust T | RotorCalculator.b4a:3693 |
| btnOperatingPair_Click | Option Help | Fixo | Solves Δθ and C_T | Solves Δθ and C_T | Solves Δθ and C_T | Não usado | Solves Δθ and C_T | RotorCalculator.b4a:3693 |
| btnOperatingPair_Click | Option | Fixo | Collective Δθ + Target C_T | Collective Δθ + Target C_T | Collective Δθ + Target C_T | Não usado | Collective Δθ + Target C_T | RotorCalculator.b4a:3694 |
| btnOperatingPair_Click | Option Help | Fixo | Solves Ω and T | Solves Ω and T | Solves Ω and T | Não usado | Solves Ω and T | RotorCalculator.b4a:3694 |
| btnOperatingPair_Click | Option | Fixo | Collective Δθ + Target Thrust T | Collective Δθ + Target Thrust T | Collective Δθ + Target Thrust T | Não usado | Collective Δθ + Target Thrust T | RotorCalculator.b4a:3695 |
| btnOperatingPair_Click | Option Help | Fixo | Solves Ω and C_T | Solves Ω and C_T | Solves Ω and C_T | Não usado | Solves Ω and C_T | RotorCalculator.b4a:3695 |
| btnOperatingPair_Click | Option | Fixo | Target C_T + Target Thrust T | Target C_T + Target Thrust T | Target C_T + Target Thrust T | Não usado | Target C_T + Target Thrust T | RotorCalculator.b4a:3696 |
| btnOperatingPair_Click | Option Help | Fixo | Solves Ω and Δθ | Solves Ω and Δθ | Solves Ω and Δθ | Não usado | Solves Ω and Δθ | RotorCalculator.b4a:3696 |
| btnHorizontalInput_Click | Dialog Title | Fixo | Horizontal Flow Input | Horizontal Flow Input | Horizontal Flow Input | Não usado | Horizontal Flow Input | RotorCalculator.b4a:3726 |
| btnAxialInput_Click | Dialog Title | Fixo | Axial Flow Input | Axial Flow Input | Axial Flow Input | Não usado | Axial Flow Input | RotorCalculator.b4a:3757 |
| btnViewPolarPlot_Click | lblTitle | Fixo | PARAMETER SWEEP | PARAMETER SWEEP | PARAMETER SWEEP | Não usado | PARAMETER SWEEP | RotorCalculator.b4a:3838 |
| btnViewPolarPlot_Click | btnClose | Fixo | × | × | × | Não usado | × | RotorCalculator.b4a:3847 |
| btnViewPolarPlot_Click | btnTable | Fixo | TABLE | TABLE | TABLE | Não usado | TABLE | RotorCalculator.b4a:3914 |
| btnViewPolarPlot_Click | btnCsv | Fixo | CSV | CSV | CSV | Não usado | CSV | RotorCalculator.b4a:3916 |
| btnViewPolarPlot_Click | btnPng | Fixo | PNG | PNG | PNG | Não usado | PNG | RotorCalculator.b4a:3919 |
| btnSweepParam_Click | Dialog Title | Fixo | Y-Axis Result | Y-Axis Result | Y-Axis Result | Não usado | Y-Axis Result | RotorCalculator.b4a:3952 |
| btnSweepMultiModel_Click | Option | Fixo | Inflow Models | Inflow Models | Inflow Models | Não usado | Inflow Models | RotorCalculator.b4a:4007 |
| btnSweepMultiModel_Click | Option Help | Fixo | All four inflow models, active settings | All four inflow models, active settings | All four inflow models, active settings | Não usado | All four inflow models, active settings | RotorCalculator.b4a:4007 |
| btnSweepMultiModel_Click | Option | Fixo | Rotor α Family | Rotor α Family | Rotor α Family | Não usado | Rotor α Family | RotorCalculator.b4a:4008 |
| btnSweepMultiModel_Click | Option Help | Fixo | Several disk angles of attack | Several disk angles of attack | Several disk angles of attack | Não usado | Several disk angles of attack | RotorCalculator.b4a:4008 |
| btnSweepMultiModel_Click | Option | Fixo | Axial Vz Family | Axial Vz Family | Axial Vz Family | Não usado | Axial Vz Family | RotorCalculator.b4a:4009 |
| btnSweepMultiModel_Click | Option Help | Fixo | Several climb speeds | Several climb speeds | Several climb speeds | Não usado | Several climb speeds | RotorCalculator.b4a:4009 |
| btnSweepMultiModel_Click | Option | Fixo | Axial μz Family | Axial μz Family | Axial μz Family | Não usado | Axial μz Family | RotorCalculator.b4a:4010 |
| btnSweepMultiModel_Click | Option Help | Fixo | Several axial flow ratios | Several axial flow ratios | Several axial flow ratios | Não usado | Several axial flow ratios | RotorCalculator.b4a:4010 |
| btnSweepMultiModel_Click | Option | Fixo | Active Only | Active Only | Active Only | Não usado | Active Only | RotorCalculator.b4a:4011 |
| btnSweepMultiModel_Click | Option Help | Fixo | Only the current condition | Only the current condition | Only the current condition | Não usado | Only the current condition | RotorCalculator.b4a:4011 |
| btnSweepMultiModel_Click | Option | Fixo | Edit Family Values… | Edit Family Values… | Edit Family Values… | Não usado | Edit Family Values… | RotorCalculator.b4a:4013 |
| btnSweepMultiModel_Click | Option Help | Fixo | Comma-separated list for the selected family | Comma-separated list for the selected family | Comma-separated list for the selected family | Não usado | Comma-separated list for the selected family | RotorCalculator.b4a:4013 |
| btnSweepValues_Click | hint | Fixo | Enter 1–9 comma-separated axial ratios. Example: -0.05, 0, 0.05 | Enter 1–9 comma-separated axial ratios. Example: -0.05, 0, 0.05 | Enter 1–9 comma-separated axial ratios. Example: -0.05, 0, 0.05 | Não usado | Enter 1–9 comma-separated axial ratios. Example: -0.05, 0, 0.05 | RotorCalculator.b4a:4102 |
| btnSweepValues_Click | hint | Fixo | Enter 1–9 comma-separated values. Example: -10, -5, 0, 5, 10 | Enter 1–9 comma-separated values. Example: -10, -5, 0, 5, 10 | Enter 1–9 comma-separated values. Example: -10, -5, 0, 5, 10 | Não usado | Enter 1–9 comma-separated values. Example: -10, -5, 0, 5, 10 | RotorCalculator.b4a:4104 |
| btnSweepMaxMu_Click | Option | Fixo | μ_x max =  | μ_x max =  | μ_x max =  | Não usado | μ_x max =  | RotorCalculator.b4a:4198 |
| btnSweepMaxMu_Click | Dialog Title | Fixo | Sweep Range | Sweep Range | Sweep Range | Não usado | Sweep Range | RotorCalculator.b4a:4202 |
| RedrawSweepPlot | lblSweepCurrentVal | Fixo | Active point: invalid operating point | Active point: invalid operating point | Active point: invalid operating point | Não usado | Active point: invalid operating point | RotorCalculator.b4a:4246 |
| OpenSweepTablePopup | close | Fixo | × | × | × | Não usado | × | RotorCalculator.b4a:4308 |
| btnSweepExportCsv_Click | Option | Fixo | Current Chart CSV | Current Chart CSV | Current Chart CSV | Não usado | Current Chart CSV | RotorCalculator.b4a:4404 |
| btnSweepExportCsv_Click | Option Help | Fixo | Table of plotted curve values vs advance ratio | Table of plotted curve values vs advance ratio | Table of plotted curve values vs advance ratio | Não usado | Table of plotted curve values vs advance ratio | RotorCalculator.b4a:4404 |
| btnSweepExportCsv_Click | Option | Fixo | Full Dataset CSV | Full Dataset CSV | Full Dataset CSV | Não usado | Full Dataset CSV | RotorCalculator.b4a:4405 |
| btnSweepExportCsv_Click | Option Help | Fixo | Complete inputs, baseline operating point, and all aerodynamic variables | Complete inputs, baseline operating point, and all aerodynamic variables | Complete inputs, baseline operating point, and all aerodynamic variables | Não usado | Complete inputs, baseline operating point, and all aerodynamic variables | RotorCalculator.b4a:4405 |
| btnSweepExportCsv_Click | Dialog Title | Fixo | Export CSV | Export CSV | Export CSV | Não usado | Export CSV | RotorCalculator.b4a:4406 |
|  | Dialog Title | Fixo | Inflow Model | Inflow Model | Inflow Model | Não usado | Inflow Model | clsSheet.bas:13 |
|  | Dialog Title | Fixo | Delete | Delete | Delete | Não usado | Delete | clsSheet.bas:14 |
| Settings | Theme | Fixo / variável | DARK / LIGHT / MIDNIGHT BLUE | DARK / LIGHT / MIDNIGHT BLUE | DARK / LIGHT / MIDNIGHT BLUE | Não usado | DARK / LIGHT / MIDNIGHT BLUE | RotorCalculator.b4a |
| Settings | Units | Fixo / variável | SI / IMPERIAL | SI / IMPERIAL | SI / IMPERIAL | Não usado | SI / IMPERIAL | RotorCalculator.b4a |
| Settings | Precision | Fixo / variável | STANDARD / +1 DECIMAL | STANDARD / +1 DECIMAL | STANDARD / +1 DECIMAL | Não usado | STANDARD / +1 DECIMAL | RotorCalculator.b4a |
| Settings | Palette | Fixo / variável | ⟨PlotPaletteName⟩ | ⟨PlotPaletteName⟩ | ⟨PlotPaletteName⟩ | Não usado | ⟨PlotPaletteName⟩ | RotorCalculator.b4a |
| Geometry | Active Rotor | Fixo / variável | ⟨nome do rotor salvo⟩ | ⟨nome do rotor salvo⟩ | ⟨nome do rotor salvo⟩ | Não usado | ⟨nome do rotor salvo⟩ | RotorCalculator.b4a |
| Geometry | Airfoil | Fixo / variável | ⟨nome do perfil⟩ / Custom | ⟨nome do perfil⟩ / Custom | ⟨nome do perfil⟩ / Custom | Não usado | ⟨nome do perfil⟩ / Custom | RotorCalculator.b4a |
| Geometry | Tip-Loss Selection | Fixo / variável | None / Fixed / Sissingh | None / Fixed / Sissingh | None / Fixed / Sissingh | Não usado | None / Fixed / Sissingh | RotorCalculator.b4a |
| Geometry | Compressibility Selection | Fixo / variável | Off / Prandtl-Glauert | Off / Prandtl-Glauert | Off / Prandtl-Glauert | Não usado | Off / Prandtl-Glauert | RotorCalculator.b4a |
| Conditions | Inflow Selection | Fixo / variável | Uniform / Coleman / Coleman-Feingold / Drees | Uniform / Coleman / Coleman-Feingold / Drees | Uniform / Coleman / Coleman-Feingold / Drees | Não usado | Uniform / Coleman / Coleman-Feingold / Drees | RotorCalculator.b4a |
| Conditions | Operating Pair | Fixo / variável | Ω + Δθ / Ω + C_T / Ω + T / Δθ + C_T / Δθ + T / C_T + T | Ω + Δθ / Ω + C_T / Ω + T / Δθ + C_T / Δθ + T / C_T + T | Ω + Δθ / Ω + C_T / Ω + T / Δθ + C_T / Δθ + T / C_T + T | Não usado | Ω + Δθ / Ω + C_T / Ω + T / Δθ + C_T / Δθ + T / C_T + T | RotorCalculator.b4a |
| Sweep | Y-Axis Button | Fixo / variável | ⟨nome completo do resultado⟩ ⟨símbolo⟩ ▾ | ⟨nome completo do resultado⟩ ⟨símbolo⟩ ▾ | ⟨nome completo do resultado⟩ ⟨símbolo⟩ ▾ | Não usado | ⟨nome completo do resultado⟩ ⟨símbolo⟩ ▾ | RotorCalculator.b4a |
| Sweep | Family Button | Fixo / variável | Curves ↵ Models / α Set / Vz Set / μz Set / Active ▾ | Curves ↵ Models / α Set / Vz Set / μz Set / Active ▾ | Curves ↵ Models / α Set / Vz Set / μz Set / Active ▾ | Não usado | Curves ↵ Models / α Set / Vz Set / μz Set / Active ▾ | RotorCalculator.b4a |
| Sweep | X-Axis Button | Fixo / variável | X axis ↵ μ_x / V_x / μ/λ ▾ | X axis ↵ μ_x / V_x / μ/λ ▾ | X axis ↵ μ_x / V_x / μ/λ ▾ | Não usado | X axis ↵ μ_x / V_x / μ/λ ▾ | RotorCalculator.b4a |
| Sweep | Range Button | Fixo / variável | Range ↵ ≤ ⟨limite⟩ ▾ | Range ↵ ≤ ⟨limite⟩ ▾ | Range ↵ ≤ ⟨limite⟩ ▾ | Não usado | Range ↵ ≤ ⟨limite⟩ ▾ | RotorCalculator.b4a |
| Sweep | Trim Button | Fixo / variável | Trim ↵ Fixed / Δθ All / Ω All / Δθ Hover / Ω Hover / None ▾ | Trim ↵ Fixed / Δθ All / Ω All / Δθ Hover / Ω Hover / None ▾ | Trim ↵ Fixed / Δθ All / Ω All / Δθ Hover / Ω Hover / None ▾ | Não usado | Trim ↵ Fixed / Δθ All / Ω All / Δθ Hover / Ω Hover / None ▾ | RotorCalculator.b4a |
| Sweep | Table Title | Fixo / variável | ⟨nome completo do resultado⟩ ⟨símbolo⟩ | ⟨nome completo do resultado⟩ ⟨símbolo⟩ | ⟨nome completo do resultado⟩ ⟨símbolo⟩ | Não usado | ⟨nome completo do resultado⟩ ⟨símbolo⟩ | RotorCalculator.b4a |
| Sweep | Readouts | Fixo / variável | ⟨ponto ativo / cursor / estado do cálculo⟩ | ⟨ponto ativo / cursor / estado do cálculo⟩ | ⟨ponto ativo / cursor / estado do cálculo⟩ | Não usado | ⟨ponto ativo / cursor / estado do cálculo⟩ | RotorCalculator.b4a |
| Results | Numeric Value | Fixo / variável | ⟨valor formatado⟩ / – | ⟨valor formatado⟩ / – | ⟨valor formatado⟩ / – | Não usado | ⟨valor formatado⟩ / – | RotorCalculator.b4a |
| Results | Trim Status | Fixo / variável | Trim: ⟨par prescrito⟩ / no solution | Trim: ⟨par prescrito⟩ / no solution | Trim: ⟨par prescrito⟩ / no solution | Não usado | Trim: ⟨par prescrito⟩ / no solution | RotorCalculator.b4a |
| Results | Model Status | Fixo / variável | ⟨validade, Mach e avisos do modelo⟩ | ⟨validade, Mach e avisos do modelo⟩ | ⟨validade, Mach e avisos do modelo⟩ | Não usado | ⟨validade, Mach e avisos do modelo⟩ | RotorCalculator.b4a |
| Dialog | Action Buttons | Fixo / variável | Save / Discard / Cancel / Restore / Import / Rename / Copy / Delete / OK | Save / Discard / Cancel / Restore / Import / Rename / Copy / Delete / OK | Save / Discard / Cancel / Restore / Import / Rename / Copy / Delete / OK | Não usado | Save / Discard / Cancel / Restore / Import / Rename / Copy / Delete / OK | RotorCalculator.b4a |
| Dialog | Help Labels | Fixo / variável | Typical range / Unit | Typical range / Unit | Typical range / Unit | Não usado | Typical range / Unit | RotorCalculator.b4a |
| Dialog | Choice Content | Fixo / variável | ⟨opção primária⟩ / ⟨descrição secundária⟩ | ⟨opção primária⟩ / ⟨descrição secundária⟩ | ⟨opção primária⟩ / ⟨descrição secundária⟩ | Não usado | ⟨opção primária⟩ / ⟨descrição secundária⟩ | RotorCalculator.b4a |
| Converter | Mode Button | Fixo / variável | ⟨conversão selecionada⟩ ▾ | ⟨conversão selecionada⟩ ▾ | ⟨conversão selecionada⟩ ▾ | Não usado | ⟨conversão selecionada⟩ ▾ | RotorCalculator.b4a |
| Converter | Input Label | Fixo / variável | VALUE IN ⟨unidade⟩ | VALUE IN ⟨unidade⟩ | VALUE IN ⟨unidade⟩ | Não usado | VALUE IN ⟨unidade⟩ | RotorCalculator.b4a |
| Converter | Result Label | Fixo / variável | ⟨valor convertido⟩ ⟨unidade⟩ | ⟨valor convertido⟩ ⟨unidade⟩ | ⟨valor convertido⟩ ⟨unidade⟩ | Não usado | ⟨valor convertido⟩ ⟨unidade⟩ | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | kW → hp | kW → hp | kW → hp | Não usado | kW → hp | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | hp → kW | hp → kW | hp → kW | Não usado | hp → kW | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | N → kgf | N → kgf | N → kgf | Não usado | N → kgf | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | kgf → N | kgf → N | kgf → N | Não usado | kgf → N | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | N → lbf | N → lbf | N → lbf | Não usado | N → lbf | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | lbf → N | lbf → N | lbf → N | Não usado | lbf → N | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | km/h → kt | km/h → kt | km/h → kt | Não usado | km/h → kt | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | kt → km/h | kt → km/h | kt → km/h | Não usado | kt → km/h | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | km/h → m/s | km/h → m/s | km/h → m/s | Não usado | km/h → m/s | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | m/s → km/h | m/s → km/h | m/s → km/h | Não usado | m/s → km/h | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | m → ft | m → ft | m → ft | Não usado | m → ft | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | ft → m | ft → m | ft → m | Não usado | ft → m | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | mm → in | mm → in | mm → in | Não usado | mm → in | RotorCalculator.b4a |
| Converter | Conversion Option | Fixo | in → mm | in → mm | in → mm | Não usado | in → mm | RotorCalculator.b4a |
| Geometry / Conditions / Results | Unit Controls | Unidade | K / N / cm / cm² / deg / deg⁻¹ / ft / ft/s / ft² / h / in / in² / kN / km / km/h / kt / lbf / m / m/s / mm / m² / rad / rad/s / rad⁻¹ / rpm / °C / °F | K / N / cm / cm² / deg / deg⁻¹ / ft / ft/s / ft² / h / in / in² / kN / km / km/h / kt / lbf / m / m/s / mm / m² / rad / rad/s / rad⁻¹ / rpm / °C / °F | K / N / cm / cm² / deg / deg⁻¹ / ft / ft/s / ft² / h / in / in² / kN / km / km/h / kt / lbf / m / m/s / mm / m² / rad / rad/s / rad⁻¹ / rpm / °C / °F | Não usado | K / N / cm / cm² / deg / deg⁻¹ / ft / ft/s / ft² / h / in / in² / kN / km / km/h / kt / lbf / m / m/s / mm / m² / rad / rad/s / rad⁻¹ / rpm / °C / °F | RotorCalculator.b4a |
