B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' RotorStorage.bas — versioned rotor geometry persistence and interchange.

Sub Process_Globals
	Private Const FILENAME As String = "rotors_db.txt"
	Private Const ACTIVE_INDEX_FILENAME As String = "active_rotor.txt"
	Private Const SCHEMA_TAG As String = "ROTORCALCULATOR_GEOMETRIES"
	Private Const SCHEMA_VERSION As Int = 2
	Public Rotors As List
	Public ActiveIndex As Int = 0
End Sub

Private Sub GetDataDir As String
	Return File.DirInternal
End Sub

Public Sub Initialize
	If Rotors.IsInitialized = False Then Rotors.Initialize
	LoadRotors
	LoadActiveIndex
End Sub

Private Sub LoadActiveIndex
	If File.Exists(GetDataDir, ACTIVE_INDEX_FILENAME) Then
		Try
			ActiveIndex = File.ReadString(GetDataDir, ACTIVE_INDEX_FILENAME).Trim
		Catch
			ActiveIndex = 0
		End Try
	End If
	If ActiveIndex < 0 Or ActiveIndex >= Rotors.Size Then ActiveIndex = 0
End Sub

Private Sub SaveActiveIndex
	File.WriteString(GetDataDir, ACTIVE_INDEX_FILENAME, ActiveIndex)
End Sub

Private Sub NewPreset(Name As String, Radius As Double, NBlades As Int, RootCutout As Double, _
	ChordAxis As Double, ChordTip As Double, ThetaRootDeg As Double, ThetaTipDeg As Double, _
	LiftSlope As Double, Cd0 As Double, TipLossMode As String, TipLossB As Double, PG As Boolean) As RotorGeometry
	Dim g As RotorGeometry
	g.Initialize
	g.Name = Name
	g.Radius = Radius
	g.RPM = 390.0 ' runtime placeholder; Conditions owns operating RPM.
	g.NBlades = NBlades
	g.RootCutout = RootCutout
	g.SolidityMode = "chords"
	g.ChordRoot = ChordAxis
	g.ChordTip = ChordTip
	g.LiftSlope0 = LiftSlope
	g.Cd0 = Cd0
	g.PitchMode = "linear_twist"
	g.ThetaRoot = ThetaRootDeg * cPI / 180.0
	g.ThetaTip = ThetaTipDeg * cPI / 180.0
	g.Theta0 = 0.5 * (g.ThetaRoot + g.ThetaTip)
	g.TipLossMode = TipLossMode
	g.TipLossB = TipLossB
	g.UsePrandtlGlauert = PG
	Return zBETEngine.ResolveSolidity(g)
End Sub

Public Sub CreateDefaultPresets As List
	Dim presets As List
	presets.Initialize
	presets.Add(NewPreset("Sikorsky UH-60 Black Hawk", 8.18, 4, 0.15, 0.53, 0.53, 14.0, -4.0, 5.73, 0.0088, "sissingh", 0.97, True))
	presets.Add(NewPreset("Bell 206 JetRanger", 5.08, 2, 0.12, 0.33, 0.33, 12.0, 2.0, 5.73, 0.0090, "fixed", 0.97, False))
	presets.Add(NewPreset("Eurocopter Bo 105", 4.92, 4, 0.14, 0.27, 0.27, 11.0, 3.0, 5.73, 0.0092, "sissingh", 0.97, True))
	presets.Add(NewPreset("Robinson R44", 5.03, 2, 0.10, 0.25, 0.25, 10.0, 4.0, 5.73, 0.0090, "fixed", 0.97, False))
	' Legacy DJI/eVTOL presets defined root chord at the cutout. These c0 values preserve that active-span law.
	presets.Add(NewPreset("DJI Matrice 300 Drone", 0.27, 2, 0.10, 0.0472222222, 0.025, 16.0, 4.0, 5.65, 0.0120, "none", 1.0, False))
	presets.Add(NewPreset("eVTOL Conceptual Rotor", 1.40, 5, 0.15, 0.1488235294, 0.09, 18.0, 4.0, 5.85, 0.0095, "sissingh", 0.97, True))
	Return presets
End Sub

Public Sub IsFactoryPresetName(Name As String) As Boolean
	Dim n As String = Name.Trim.ToLowerCase
	Dim presets As List = CreateDefaultPresets
	For i = 0 To presets.Size - 1
		Dim g As RotorGeometry = presets.Get(i)
		If g.Name.Trim.ToLowerCase = n Then Return True
	Next
	Return False
End Sub

Public Sub RestoreFactoryPresets
	Dim defaults As List = CreateDefaultPresets
	For i = 0 To defaults.Size - 1
		Dim factoryGeom As RotorGeometry = defaults.Get(i)
		Dim existing As Int = FindRotorByName(factoryGeom.Name)
		If existing >= 0 Then
			Rotors.Set(existing, zBETEngine.CloneGeometry(factoryGeom))
		Else
			Rotors.Add(zBETEngine.CloneGeometry(factoryGeom))
		End If
	Next
	If ActiveIndex < 0 Or ActiveIndex >= Rotors.Size Then ActiveIndex = 0
	SaveRotors
	SaveActiveIndex
End Sub

Private Sub IsFiniteD(value As Double) As Boolean
	If value <> value Then Return False
	If Abs(value) > 1.0e100 Then Return False
	Return True
End Sub

Private Sub IsImportedGeometryValid(g As RotorGeometry) As Boolean
	If g.Name.Trim = "" Then Return False
	If IsFiniteD(g.Radius) = False Or g.Radius < 0.02 Or g.Radius > 50.0 Then Return False
	If g.NBlades < 1 Or g.NBlades > 16 Then Return False
	If IsFiniteD(g.RootCutout) = False Or g.RootCutout < 0.0 Or g.RootCutout > 0.95 Then Return False
	If IsFiniteD(g.ChordRoot) = False Or g.ChordRoot <= 0.0 Or g.ChordRoot > 2.0 * g.Radius Then Return False
	If IsFiniteD(g.ChordTip) = False Or g.ChordTip <= 0.0 Or g.ChordTip > 2.0 * g.Radius Then Return False
	If IsFiniteD(g.ThetaRoot) = False Or Abs(g.ThetaRoot) > cPI / 2.0 Then Return False
	If IsFiniteD(g.ThetaTip) = False Or Abs(g.ThetaTip) > cPI / 2.0 Then Return False
	If IsFiniteD(g.LiftSlope0) = False Or g.LiftSlope0 < 0.1 Or g.LiftSlope0 > 10.0 Then Return False
	If IsFiniteD(g.Cd0) = False Or g.Cd0 < 0.0 Or g.Cd0 > 0.5 Then Return False
	If g.TipLossMode <> "none" And g.TipLossMode <> "fixed" And g.TipLossMode <> "sissingh" Then Return False
	If g.TipLossMode = "fixed" Then
		If IsFiniteD(g.TipLossB) = False Or g.TipLossB <= g.RootCutout Or g.TipLossB > 1.0 Then Return False
	End If
	Return True
End Sub

Private Sub CleanName(Name As String) As String
	Dim n As String = Name.Trim.Replace("|", "/").Replace(CR, " ").Replace(LF, " ")
	If n = "" Then n = "Imported Rotor"
	If n.Length > 80 Then n = n.SubString2(0, 80)
	Return n
End Sub

Private Sub SerializeRotor(g As RotorGeometry) As String
	Dim pg As String = "0"
	If g.UsePrandtlGlauert Then pg = "1"
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append("R|").Append(CleanName(g.Name)).Append("|")
	sb.Append(g.Radius).Append("|").Append(g.NBlades).Append("|").Append(g.RootCutout).Append("|")
	sb.Append(g.ChordRoot).Append("|").Append(g.ChordTip).Append("|")
	sb.Append(g.ThetaRoot).Append("|").Append(g.ThetaTip).Append("|")
	sb.Append(g.LiftSlope0).Append("|").Append(g.Cd0).Append("|")
	sb.Append(g.TipLossMode).Append("|").Append(g.TipLossB).Append("|").Append(pg)
	Return sb.ToString
End Sub

Private Sub ParseV2Rotor(parts() As String) As RotorGeometry
	Dim g As RotorGeometry
	g.Initialize
	g.Name = CleanName(parts(1))
	g.Radius = parts(2)
	g.RPM = 390.0
	g.NBlades = parts(3)
	g.RootCutout = parts(4)
	g.SolidityMode = "chords"
	g.ChordRoot = parts(5)
	g.ChordTip = parts(6)
	g.PitchMode = "linear_twist"
	g.ThetaRoot = parts(7)
	g.ThetaTip = parts(8)
	g.Theta0 = 0.5 * (g.ThetaRoot + g.ThetaTip)
	g.LiftSlope0 = parts(9)
	g.Cd0 = parts(10)
	g.TipLossMode = parts(11)
	g.TipLossB = parts(12)
	g.UsePrandtlGlauert = (parts(13) = "1")
	Return g
End Sub

Private Sub ParseLegacyRotor(parts() As String) As RotorGeometry
	Dim g As RotorGeometry
	g.Initialize
	g.Name = CleanName(parts(0))
	g.Radius = parts(1)
	g.RPM = 390.0
	g.NBlades = parts(3)
	g.RootCutout = parts(4)
	g.SolidityMode = "chords"
	Dim oldRoot As Double = parts(9)
	Dim tip As Double = parts(10)
	' Legacy ChordRoot was the physical chord at x0. Recover the zBEMT reference-axis c0.
	If g.RootCutout < 0.999 Then
		g.ChordRoot = oldRoot - (tip - oldRoot) * g.RootCutout / (1.0 - g.RootCutout)
	Else
		g.ChordRoot = oldRoot
	End If
	g.ChordTip = tip
	g.LiftSlope0 = parts(11)
	g.Cd0 = parts(12)
	g.PitchMode = "linear_twist"
	g.ThetaRoot = parts(15)
	g.ThetaTip = parts(16)
	g.Theta0 = 0.5 * (g.ThetaRoot + g.ThetaTip)
	g.TipLossMode = parts(17)
	If parts.Length >= 19 Then g.TipLossB = parts(18) Else g.TipLossB = 0.97
	If parts.Length >= 20 Then g.UsePrandtlGlauert = (parts(19) = "1") Else g.UsePrandtlGlauert = False
	Return zBETEngine.ResolveSolidity(g)
End Sub

Public Sub ExportDatabaseText As String
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append(SCHEMA_TAG).Append("|").Append(SCHEMA_VERSION).Append(CRLF)
	For i = 0 To Rotors.Size - 1
		sb.Append(SerializeRotor(Rotors.Get(i))).Append(CRLF)
	Next
	Return sb.ToString
End Sub

Public Sub ParseDatabaseText(Text As String) As List
	Dim imported As List
	imported.Initialize
	Dim lines() As String = Regex.Split("\r?\n", Text)
	Dim version As Int = 0
	For i = 0 To lines.Length - 1
		Dim line As String = lines(i).Trim
		If line = "" Then Continue
		Dim parts() As String = Regex.Split("\|", line)
		If parts.Length >= 2 And parts(0) = SCHEMA_TAG Then
			version = parts(1)
		Else If version = 2 And parts.Length >= 14 And parts(0) = "R" Then
			Try
				Dim importedGeom As RotorGeometry = ParseV2Rotor(parts)
				If IsImportedGeometryValid(importedGeom) Then
					imported.Add(zBETEngine.ResolveSolidity(importedGeom))
				Else
					Log("Skipping out-of-domain imported rotor line " & i)
				End If
			Catch
				Log("Skipping invalid imported rotor line " & i)
			End Try
		End If
	Next
	Return imported
End Sub

Public Sub LoadRotors As List
	If File.Exists(GetDataDir, FILENAME) Then
		Try
			Dim text As String = File.ReadString(GetDataDir, FILENAME)
			If text.StartsWith(SCHEMA_TAG & "|") Then
				Rotors = ParseDatabaseText(text)
			Else
				' Legacy v1 line database.
				Dim rawList As List = File.ReadList(GetDataDir, FILENAME)
				Rotors.Initialize
				For i = 0 To rawList.Size - 1
					Dim parts() As String = Regex.Split("\|", rawList.Get(i))
					If parts.Length >= 18 Then Rotors.Add(ParseLegacyRotor(parts))
				Next
				' Persist migrated data once in v2 format.
				If Rotors.Size > 0 Then SaveRotors
			End If
		Catch
			Log("Rotor database could not be read; restoring factory presets.")
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
	If ActiveIndex < 0 Or ActiveIndex >= Rotors.Size Then ActiveIndex = 0
	Return Rotors
End Sub

Public Sub SaveRotors
	File.WriteString(GetDataDir, FILENAME, ExportDatabaseText)
End Sub

Public Sub GetActiveRotor As RotorGeometry
	If Rotors.Size = 0 Then Rotors = CreateDefaultPresets
	If ActiveIndex < 0 Or ActiveIndex >= Rotors.Size Then ActiveIndex = 0
	Return zBETEngine.CloneGeometry(Rotors.Get(ActiveIndex))
End Sub

Public Sub SetActiveRotor(index As Int)
	If index >= 0 And index < Rotors.Size Then
		ActiveIndex = index
		SaveActiveIndex
	End If
End Sub

Public Sub UpdateRotor(index As Int, g As RotorGeometry)
	If index >= 0 And index < Rotors.Size Then
		g.Name = CleanName(g.Name)
		Dim sameName As Int = FindRotorByName(g.Name)
		If sameName >= 0 And sameName <> index Then g.Name = MakeUniqueName(g.Name)
		g.SolidityMode = "chords"
		g.PitchMode = "linear_twist"
		g = zBETEngine.ResolveSolidity(g)
		Rotors.Set(index, zBETEngine.CloneGeometry(g))
		SaveRotors
	End If
End Sub

Public Sub AddRotor(g As RotorGeometry) As Int
	g.Name = MakeUniqueName(CleanName(g.Name))
	g.SolidityMode = "chords"
	g.PitchMode = "linear_twist"
	g = zBETEngine.ResolveSolidity(g)
	Rotors.Add(zBETEngine.CloneGeometry(g))
	ActiveIndex = Rotors.Size - 1
	SaveRotors
	SaveActiveIndex
	Return ActiveIndex
End Sub

Public Sub CreateNewRotor As Int
	Dim g As RotorGeometry = zBETEngine.CreateDefaultGeometry
	g.Name = MakeUniqueName("Custom Rotor")
	g.SolidityMode = "chords"
	g.PitchMode = "linear_twist"
	Return AddRotor(g)
End Sub

Public Sub DuplicateRotor(index As Int) As Int
	If index < 0 Or index >= Rotors.Size Then Return ActiveIndex
	Dim g As RotorGeometry = zBETEngine.CloneGeometry(Rotors.Get(index))
	g.Name = MakeCopyName(g.Name)
	Return AddRotor(g)
End Sub

Public Sub DeleteRotor(index As Int) As Boolean
	If Rotors.Size <= 1 Or index < 0 Or index >= Rotors.Size Then Return False
	Rotors.RemoveAt(index)
	If ActiveIndex >= Rotors.Size Then ActiveIndex = Rotors.Size - 1
	SaveRotors
	SaveActiveIndex
	Return True
End Sub

Public Sub FindRotorByName(Name As String) As Int
	For i = 0 To Rotors.Size - 1
		Dim g As RotorGeometry = Rotors.Get(i)
		If g.Name.Trim.ToLowerCase = Name.Trim.ToLowerCase Then Return i
	Next
	Return -1
End Sub

Public Sub MakeCopyName(SourceName As String) As String
	Dim base As String = CleanName(SourceName)
	Dim parts() As String = Regex.Split(" ", base)
	If parts.Length >= 2 Then
		Dim lastPart As String = parts(parts.Length - 1)
		Dim lastLower As String = lastPart.ToLowerCase
		If lastLower = "copy" Or lastLower = "(copy)" Then
			base = base.SubString2(0, base.Length - lastPart.Length - 1).Trim
		Else If parts.Length >= 3 And IsNumber(lastPart) Then
			Dim previousPart As String = parts(parts.Length - 2)
			If previousPart.ToLowerCase = "copy" Then
				base = base.SubString2(0, base.Length - lastPart.Length - previousPart.Length - 2).Trim
			End If
		End If
	End If
	Return MakeUniqueName(base & " Copy")
End Sub

Public Sub MakeUniqueName(BaseName As String) As String
	Dim clean As String = CleanName(BaseName)
	If FindRotorByName(clean) < 0 Then Return clean
	Dim suffix As Int = 2
	Do While FindRotorByName(clean & " " & suffix) >= 0
		suffix = suffix + 1
	Loop
	Return clean & " " & suffix
End Sub

' conflictMode: replace | rename | skip. Returns number imported.
Public Sub MergeImportedRotors(imported As List, conflictMode As String) As Int
	Dim added As Int = 0
	For i = 0 To imported.Size - 1
		Dim g As RotorGeometry = imported.Get(i)
		Dim existing As Int = FindRotorByName(g.Name)
		If existing >= 0 Then
			Select conflictMode
				Case "replace"
					UpdateRotor(existing, g)
					added = added + 1
				Case "rename"
					g.Name = MakeUniqueName(g.Name)
					Rotors.Add(zBETEngine.CloneGeometry(g))
					added = added + 1
				Case Else
					' skip
			End Select
		Else
			Rotors.Add(zBETEngine.CloneGeometry(g))
			added = added + 1
		End If
	Next
	If added > 0 Then SaveRotors
	Return added
End Sub

Public Sub ResetToDefaults
	Rotors = CreateDefaultPresets
	ActiveIndex = 0
	SaveRotors
	SaveActiveIndex
End Sub
