B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' RotorStorage.bas — Módulo de Persistência e Gerenciamento de Rotores
' Armazena e carrega geometrias salvas pelo usuário e disponibiliza presets de fábrica calibrados.

Sub Process_Globals
	
	Private Const FILENAME As String = "rotors_db.txt"
	Private Const ACTIVE_INDEX_FILENAME As String = "active_rotor.txt"
	Public Rotors As List
	Public ActiveIndex As Int = 0
	
End Sub

' Retorna o diretório de dados seguro do app
Private Sub GetDataDir As String
	Return File.DirInternal
End Sub

' Inicializa o sistema de armazenamento e carrega a lista de rotores
Public Sub Initialize
	If Rotors.IsInitialized = False Then
		Rotors.Initialize
	End If
	LoadRotors
	LoadActiveIndex
End Sub

Private Sub LoadActiveIndex
	Dim targetDir As String = GetDataDir
	If File.Exists(targetDir, ACTIVE_INDEX_FILENAME) Then
		Try
			ActiveIndex = File.ReadString(targetDir, ACTIVE_INDEX_FILENAME).Trim
		Catch
			ActiveIndex = 0
		End Try
	End If
	If ActiveIndex < 0 Or ActiveIndex >= Rotors.Size Then ActiveIndex = 0
End Sub

Private Sub SaveActiveIndex
	File.WriteString(GetDataDir, ACTIVE_INDEX_FILENAME, ActiveIndex)
End Sub

' Cria a lista de presets de fábrica
Public Sub CreateDefaultPresets As List
	Dim presets As List
	presets.Initialize
	
	' 1. Sikorsky UH-60 Black Hawk
	Dim uh60 As RotorGeometry
	uh60.Initialize
	uh60.Name = "Sikorsky UH-60 Black Hawk"
	uh60.Radius = 8.18
	uh60.RPM = 258.0
	uh60.NBlades = 4
	uh60.RootCutout = 0.15
	uh60.SolidityMode = "chords"
	uh60.ChordRoot = 0.53
	uh60.ChordTip = 0.53
	uh60.LiftSlope0 = 5.73
	uh60.Cd0 = 0.0088
	uh60.PitchMode = "linear_twist"
	uh60.ThetaRoot = 14.0 * cPI / 180.0
	uh60.ThetaTip = -4.0 * cPI / 180.0
	uh60.Theta0 = 5.0 * cPI / 180.0
	uh60.TipLossMode = "sissingh"
	uh60.TipLossB = 0.97
	uh60.UsePrandtlGlauert = True
	presets.Add(zBETEngine.ResolveSolidity(uh60))
	
	' 2. Bell 206 JetRanger
	Dim b206 As RotorGeometry
	b206.Initialize
	b206.Name = "Bell 206 JetRanger"
	b206.Radius = 5.08
	b206.RPM = 394.0
	b206.NBlades = 2
	b206.RootCutout = 0.12
	b206.SolidityMode = "chords"
	b206.ChordRoot = 0.33
	b206.ChordTip = 0.33
	b206.LiftSlope0 = 5.73
	b206.Cd0 = 0.0090
	b206.PitchMode = "linear_twist"
	b206.ThetaRoot = 12.0 * cPI / 180.0
	b206.ThetaTip = 2.0 * cPI / 180.0
	b206.Theta0 = 7.0 * cPI / 180.0
	b206.TipLossMode = "fixed"
	b206.TipLossB = 0.97
	b206.UsePrandtlGlauert = False
	presets.Add(zBETEngine.ResolveSolidity(b206))
	
	' 3. Eurocopter Bo 105
	Dim bo105 As RotorGeometry
	bo105.Initialize
	bo105.Name = "Eurocopter Bo 105"
	bo105.Radius = 4.92
	bo105.RPM = 424.0
	bo105.NBlades = 4
	bo105.RootCutout = 0.14
	bo105.SolidityMode = "chords"
	bo105.ChordRoot = 0.27
	bo105.ChordTip = 0.27
	bo105.LiftSlope0 = 5.73
	bo105.Cd0 = 0.0092
	bo105.PitchMode = "linear_twist"
	bo105.ThetaRoot = 11.0 * cPI / 180.0
	bo105.ThetaTip = 3.0 * cPI / 180.0
	bo105.Theta0 = 7.0 * cPI / 180.0
	bo105.TipLossMode = "sissingh"
	bo105.TipLossB = 0.97
	bo105.UsePrandtlGlauert = True
	presets.Add(zBETEngine.ResolveSolidity(bo105))
	
	' 4. Robinson R44
	Dim r44 As RotorGeometry
	r44.Initialize
	r44.Name = "Robinson R44"
	r44.Radius = 5.03
	r44.RPM = 400.0
	r44.NBlades = 2
	r44.RootCutout = 0.10
	r44.SolidityMode = "chords"
	r44.ChordRoot = 0.25
	r44.ChordTip = 0.25
	r44.LiftSlope0 = 5.73
	r44.Cd0 = 0.0090
	r44.PitchMode = "linear_twist"
	r44.ThetaRoot = 10.0 * cPI / 180.0
	r44.ThetaTip = 4.0 * cPI / 180.0
	r44.Theta0 = 7.0 * cPI / 180.0
	r44.TipLossMode = "fixed"
	r44.TipLossB = 0.97
	r44.UsePrandtlGlauert = False
	presets.Add(zBETEngine.ResolveSolidity(r44))
	
	' 5. DJI Matrice 300 Drone
	Dim dji As RotorGeometry
	dji.Initialize
	dji.Name = "DJI Matrice 300 Drone"
	dji.Radius = 0.27
	dji.RPM = 4800.0
	dji.NBlades = 2
	dji.RootCutout = 0.10
	dji.SolidityMode = "chords"
	dji.ChordRoot = 0.045
	dji.ChordTip = 0.025
	dji.LiftSlope0 = 5.65
	dji.Cd0 = 0.0120
	dji.PitchMode = "linear_twist"
	dji.ThetaRoot = 16.0 * cPI / 180.0
	dji.ThetaTip = 4.0 * cPI / 180.0
	dji.Theta0 = 10.0 * cPI / 180.0
	dji.TipLossMode = "none"
	dji.TipLossB = 1.0
	dji.UsePrandtlGlauert = False
	presets.Add(zBETEngine.ResolveSolidity(dji))
	
	' 6. eVTOL Conceptual Rotor
	Dim evtol As RotorGeometry
	evtol.Initialize
	evtol.Name = "eVTOL Conceptual Rotor"
	evtol.Radius = 1.40
	evtol.RPM = 1800.0
	evtol.NBlades = 5
	evtol.RootCutout = 0.15
	evtol.SolidityMode = "chords"
	evtol.ChordRoot = 0.14
	evtol.ChordTip = 0.09
	evtol.LiftSlope0 = 5.85
	evtol.Cd0 = 0.0095
	evtol.PitchMode = "linear_twist"
	evtol.ThetaRoot = 18.0 * cPI / 180.0
	evtol.ThetaTip = 4.0 * cPI / 180.0
	evtol.Theta0 = 11.0 * cPI / 180.0
	evtol.TipLossMode = "sissingh"
	evtol.TipLossB = 0.97
	evtol.UsePrandtlGlauert = True
	presets.Add(zBETEngine.ResolveSolidity(evtol))
	
	Return presets
End Sub

' Carrega a lista de rotores a partir do arquivo
Public Sub LoadRotors As List
	Dim targetDir As String = GetDataDir
	
	If File.Exists(targetDir, FILENAME) Then
		Try
			Dim rawList As List = File.ReadList(targetDir, FILENAME)
			Rotors.Initialize
			
			For i = 0 To rawList.Size - 1
				Dim line As String = rawList.Get(i)
				Dim parts() As String = Regex.Split("\|", line)
				If parts.Length >= 18 Then
					Dim g As RotorGeometry
					g.Initialize
					g.Name = parts(0)
					g.Radius = parts(1)
					g.RPM = parts(2)
					g.NBlades = parts(3)
					g.RootCutout = parts(4)
					g.SolidityMode = parts(5)
					g.SigmaRef = parts(6)
					g.SigmaGeom = parts(7)
					g.SigmaThrust = parts(8)
					g.ChordRoot = parts(9)
					g.ChordTip = parts(10)
					g.LiftSlope0 = parts(11)
					g.Cd0 = parts(12)
					g.PitchMode = parts(13)
					g.Theta0 = parts(14)
					g.ThetaRoot = parts(15)
					g.ThetaTip = parts(16)
					g.TipLossMode = parts(17)
					If parts.Length >= 19 Then g.TipLossB = parts(18) Else g.TipLossB = 0.97
					If parts.Length >= 20 Then g.UsePrandtlGlauert = (parts(19) = "1") Else g.UsePrandtlGlauert = False
					
					g = zBETEngine.ResolveSolidity(g)
					Rotors.Add(g)
				End If
			Next
		Catch
			Log("Erro ao ler rotors_db.txt. Restaurando padrões...")
			Rotors = CreateDefaultPresets
			SaveRotors
		End Try
	Else
		Rotors = CreateDefaultPresets
		SaveRotors
	End If
	
	If Rotors.Size = 0 Then
		Rotors = CreateDefaultPresets
		SaveRotors
	End If
	
	If ActiveIndex >= Rotors.Size Then
		ActiveIndex = 0
	End If
	
	Return Rotors
End Sub

' Salva a lista de rotores atual no arquivo seguro
Public Sub SaveRotors
	Dim targetDir As String = GetDataDir
	Dim lines As List
	lines.Initialize
	
	For i = 0 To Rotors.Size - 1
		Dim g As RotorGeometry = Rotors.Get(i)
		Dim pgStr As String = "0"
		If g.UsePrandtlGlauert Then pgStr = "1"
		
		Dim sb As StringBuilder
		sb.Initialize
		sb.Append(g.Name).Append("|")
		sb.Append(g.Radius).Append("|")
		sb.Append(g.RPM).Append("|")
		sb.Append(g.NBlades).Append("|")
		sb.Append(g.RootCutout).Append("|")
		sb.Append(g.SolidityMode).Append("|")
		sb.Append(g.SigmaRef).Append("|")
		sb.Append(g.SigmaGeom).Append("|")
		sb.Append(g.SigmaThrust).Append("|")
		sb.Append(g.ChordRoot).Append("|")
		sb.Append(g.ChordTip).Append("|")
		sb.Append(g.LiftSlope0).Append("|")
		sb.Append(g.Cd0).Append("|")
		sb.Append(g.PitchMode).Append("|")
		sb.Append(g.Theta0).Append("|")
		sb.Append(g.ThetaRoot).Append("|")
		sb.Append(g.ThetaTip).Append("|")
		sb.Append(g.TipLossMode).Append("|")
		sb.Append(g.TipLossB).Append("|")
		sb.Append(pgStr)
		lines.Add(sb.ToString)
	Next
	
	File.WriteList(targetDir, FILENAME, lines)
End Sub

' Obtém o rotor atualmente ativo
Public Sub GetActiveRotor As RotorGeometry
	If Rotors.Size = 0 Then
		Rotors = CreateDefaultPresets
	End If
	If ActiveIndex < 0 Or ActiveIndex >= Rotors.Size Then
		ActiveIndex = 0
	End If
	Return Rotors.Get(ActiveIndex)
End Sub

' Define o rotor ativo pelo índice
Public Sub SetActiveRotor(index As Int)
	If index >= 0 And index < Rotors.Size Then
		ActiveIndex = index
		SaveActiveIndex
	End If
End Sub

' Cria uma geometria customizada nova sem alterar presets existentes.
Public Sub CreateNewRotor As Int
	Dim g As RotorGeometry = zBETEngine.CreateDefaultGeometry
	' The Geometry editor exposes chord and root/tip pitch directly, so a new
	' custom rotor must use those same parameterizations from its first frame.
	g.SolidityMode = "chords"
	g.PitchMode = "linear_twist"
	g.ThetaRoot = 12.0 * cPI / 180.0
	g.ThetaTip = 4.0 * cPI / 180.0
	g.Theta0 = 8.0 * cPI / 180.0
	g = zBETEngine.ResolveSolidity(g)
	Dim baseName As String = "Custom Rotor"
	Dim candidate As String = baseName
	Dim suffix As Int = 2
	Do While RotorNameExists(candidate)
		candidate = baseName & " " & suffix
		suffix = suffix + 1
	Loop
	g.Name = candidate
	Return AddRotor(g)
End Sub

Private Sub RotorNameExists(candidate As String) As Boolean
	For i = 0 To Rotors.Size - 1
		Dim g As RotorGeometry = Rotors.Get(i)
		If g.Name.Trim.ToLowerCase = candidate.Trim.ToLowerCase Then Return True
	Next
	Return False
End Sub

' Adiciona um novo rotor e o seleciona
Public Sub AddRotor(g As RotorGeometry) As Int
	g = zBETEngine.ResolveSolidity(g)
	Rotors.Add(g)
	SaveRotors
	ActiveIndex = Rotors.Size - 1
	SaveActiveIndex
	Return ActiveIndex
End Sub

' Atualiza o rotor no índice especificado
Public Sub UpdateRotor(index As Int, g As RotorGeometry)
	If index >= 0 And index < Rotors.Size Then
		g = zBETEngine.ResolveSolidity(g)
		Rotors.Set(index, g)
		SaveRotors
	End If
End Sub

' Duplica o rotor atual
Public Sub DuplicateRotor(index As Int) As Int
	If index >= 0 And index < Rotors.Size Then
		Dim src As RotorGeometry = Rotors.Get(index)
		Dim clone As RotorGeometry
		clone.Initialize
		clone.Name = src.Name & " (Copy)"
		clone.Radius = src.Radius
		clone.RPM = src.RPM
		clone.NBlades = src.NBlades
		clone.RootCutout = src.RootCutout
		clone.SolidityMode = src.SolidityMode
		clone.SigmaRef = src.SigmaRef
		clone.SigmaGeom = src.SigmaGeom
		clone.SigmaThrust = src.SigmaThrust
		clone.ChordRoot = src.ChordRoot
		clone.ChordTip = src.ChordTip
		clone.LiftSlope0 = src.LiftSlope0
		clone.Cd0 = src.Cd0
		clone.PitchMode = src.PitchMode
		clone.Theta0 = src.Theta0
		clone.ThetaRoot = src.ThetaRoot
		clone.ThetaTip = src.ThetaTip
		clone.TipLossMode = src.TipLossMode
		clone.TipLossB = src.TipLossB
		clone.UsePrandtlGlauert = src.UsePrandtlGlauert
		
		clone = zBETEngine.ResolveSolidity(clone)
		Rotors.Add(clone)
		SaveRotors
		ActiveIndex = Rotors.Size - 1
		SaveActiveIndex
		Return ActiveIndex
	End If
	Return ActiveIndex
End Sub

' Deleta o rotor no índice especificado
Public Sub DeleteRotor(index As Int) As Boolean
	If Rotors.Size <= 1 Then
		' Não permite deletar o último rotor remanescente
		Return False
	End If
	If index >= 0 And index < Rotors.Size Then
		Rotors.RemoveAt(index)
		If ActiveIndex >= Rotors.Size Then
			ActiveIndex = Rotors.Size - 1
		End If
		SaveRotors
		SaveActiveIndex
		Return True
	End If
	Return False
End Sub

' Restaura os presets de fábrica
Public Sub ResetToDefaults
	Rotors = CreateDefaultPresets
	ActiveIndex = 0
	SaveRotors
	SaveActiveIndex
End Sub
