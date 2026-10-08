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
	Private Const SCHEMA_VERSION As Int = 3
	Private Const BACKUP_FILENAME As String = "rotors_db.bak"
	Public Rotors As List
	Public ActiveIndex As Int = 0
	Public LastImportFirstIndex As Int = -1
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
	LiftSlope As Double, Cd0 As Double, TipLossMode As String, TipLossB As Double, PG As Boolean, NomRPM As Double) As RotorGeometry
	Dim g As RotorGeometry
	g.Initialize
	g.Name = Name
	g.Radius = Radius
	g.RPM = NomRPM ' runtime placeholder; Conditions owns operating RPM.
	g.NominalRPM = NomRPM
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
	presets.Add(NewPreset("Sikorsky UH-60 Black Hawk", 8.18, 4, 0.15, 0.53, 0.53, 14.0, -4.0, 5.73, 0.0088, "sissingh", 0.97, True, 258.0))
	presets.Add(NewPreset("Bell 206 JetRanger", 5.08, 2, 0.12, 0.33, 0.33, 12.0, 2.0, 5.73, 0.0090, "fixed", 0.97, False, 394.0))
	presets.Add(NewPreset("Eurocopter Bo 105", 4.92, 4, 0.14, 0.27, 0.27, 11.0, 3.0, 5.73, 0.0092, "sissingh", 0.97, True, 424.0))
	presets.Add(NewPreset("Robinson R44", 5.03, 2, 0.10, 0.25, 0.25, 10.0, 4.0, 5.73, 0.0090, "fixed", 0.97, False, 408.0))
	' Legacy DJI/eVTOL presets defined root chord at the cutout. These c0 values preserve that active-span law.
	presets.Add(NewPreset("DJI Matrice 300 Drone", 0.27, 2, 0.10, 0.0472222222, 0.025, 16.0, 4.0, 5.65, 0.0120, "none", 1.0, False, 5300.0))
	presets.Add(NewPreset("eVTOL Conceptual Rotor", 1.40, 5, 0.15, 0.1488235294, 0.09, 18.0, 4.0, 5.85, 0.0095, "sissingh", 0.97, True, 1160.0))
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
	Dim n As String = Name.Trim.Replace("|", "/").Replace(Chr(13), " ").Replace(Chr(10), " ")
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
	sb.Append(g.TipLossMode).Append("|").Append(g.TipLossB).Append("|").Append(pg).Append("|").Append(g.NominalRPM)
	Return sb.ToString
End Sub

' Migration default: tip speed 210 m/s (R > 1 m) or 120 m/s (small rotors/props).
Private Sub DefaultNominalRPM(radius As Double) As Double
	Dim vtip As Double = 120.0
	If radius > 1.0 Then vtip = 210.0
	Return 60.0 * vtip / (2.0 * cPI * Max(0.02, radius))
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
	If parts.Length >= 15 Then g.NominalRPM = parts(14) Else g.NominalRPM = DefaultNominalRPM(g.Radius)
	If g.NominalRPM <= 0 Then g.NominalRPM = DefaultNominalRPM(g.Radius)
	g.RPM = g.NominalRPM
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
	g.NominalRPM = DefaultNominalRPM(g.Radius)
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

Public Sub ExportDatabaseJSON As String
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append("{").Append(CRLF)
	sb.Append("  ""schema"": ""ROTORCALCULATOR_GEOMETRIES"",").Append(CRLF)
	sb.Append("  ""version"": 2,").Append(CRLF)
	sb.Append("  ""exportedAt"": """ & DateTime.Date(DateTime.Now) & "T" & DateTime.Time(DateTime.Now) & """,").Append(CRLF)
	sb.Append("  ""rotors"": [").Append(CRLF)
	For i = 0 To Rotors.Size - 1
		Dim g As RotorGeometry = Rotors.Get(i)
		Dim pgStr As String = "false"
		If g.UsePrandtlGlauert Then pgStr = "true"
		sb.Append("    {").Append(CRLF)
		sb.Append("      ""id"": ""rotor-" & (i + 1) & """,").Append(CRLF)
		sb.Append("      ""name"": """ & EscapeJson(g.Name) & """,").Append(CRLF)
		sb.Append("      ""geom"": {").Append(CRLF)
		sb.Append("        ""name"": """ & EscapeJson(g.Name) & """,").Append(CRLF)
		sb.Append("        ""radius"": " & g.Radius & ",").Append(CRLF)
		sb.Append("        ""rpm"": " & g.NominalRPM & ",").Append(CRLF)
		sb.Append("        ""nominalRpm"": " & g.NominalRPM & ",").Append(CRLF)
		sb.Append("        ""nBlades"": " & g.NBlades & ",").Append(CRLF)
		sb.Append("        ""rootCutout"": " & g.RootCutout & ",").Append(CRLF)
		sb.Append("        ""solidityMode"": ""chords"",").Append(CRLF)
		sb.Append("        ""chordRoot"": " & g.ChordRoot & ",").Append(CRLF)
		sb.Append("        ""chordTip"": " & g.ChordTip & ",").Append(CRLF)
		sb.Append("        ""pitchMode"": ""linear_twist"",").Append(CRLF)
		sb.Append("        ""thetaRoot"": " & g.ThetaRoot & ",").Append(CRLF)
		sb.Append("        ""thetaTip"": " & g.ThetaTip & ",").Append(CRLF)
		sb.Append("        ""theta0"": " & (0.5 * (g.ThetaRoot + g.ThetaTip)) & ",").Append(CRLF)
		sb.Append("        ""liftSlope0"": " & g.LiftSlope0 & ",").Append(CRLF)
		sb.Append("        ""cd0"": " & g.Cd0 & ",").Append(CRLF)
		sb.Append("        ""tipLossMode"": """ & g.TipLossMode & """,").Append(CRLF)
		sb.Append("        ""tipLossB"": " & g.TipLossB & ",").Append(CRLF)
		sb.Append("        ""usePrandtlGlauert"": " & pgStr).Append(CRLF)
		sb.Append("      }").Append(CRLF)
		If i < Rotors.Size - 1 Then sb.Append("    },").Append(CRLF) Else sb.Append("    }").Append(CRLF)
	Next
	sb.Append("  ]").Append(CRLF)
	sb.Append("}")
	Return sb.ToString
End Sub

Private Sub EscapeJson(s As String) As String
	Dim res As String = s.Replace("\", "\\").Replace(Chr(34), "\" & Chr(34))
	res = res.Replace(Chr(10), "\n").Replace(Chr(13), "\r").Replace(Chr(9), "\t")
	Return res
End Sub

Public Sub ParseDatabaseJSON(jsonStr As String) As List
	Dim imported As List
	imported.Initialize
	Try
		Dim rootObj As JavaObject
		rootObj.InitializeNewInstance("org.json.JSONObject", Array(jsonStr))
		Dim arr As JavaObject
		If rootObj.RunMethod("has", Array("rotors")) Then
			arr = rootObj.RunMethod("getJSONArray", Array("rotors"))
		Else
			Return imported
		End If
		Dim count As Int = arr.RunMethod("length", Null)
		For i = 0 To count - 1
			Dim item As JavaObject = arr.RunMethod("getJSONObject", Array(i))
			Dim geomObj As JavaObject
			If item.RunMethod("has", Array("geom")) Then
				geomObj = item.RunMethod("getJSONObject", Array("geom"))
			Else
				geomObj = item
			End If
			Dim g As RotorGeometry
			g.Initialize
			g.Name = CleanName(geomObj.RunMethod("optString", Array("name", "Imported Rotor")))
			g.Radius = geomObj.RunMethod("optDouble", Array("radius", 1.0))
			g.NBlades = geomObj.RunMethod("optInt", Array("nBlades", 2))
			g.RootCutout = geomObj.RunMethod("optDouble", Array("rootCutout", 0.1))
			g.SolidityMode = "chords"
			g.ChordRoot = geomObj.RunMethod("optDouble", Array("chordRoot", 0.1))
			g.ChordTip = geomObj.RunMethod("optDouble", Array("chordTip", 0.1))
			g.PitchMode = "linear_twist"
			g.ThetaRoot = geomObj.RunMethod("optDouble", Array("thetaRoot", 0.0))
			g.ThetaTip = geomObj.RunMethod("optDouble", Array("thetaTip", 0.0))
			g.Theta0 = 0.5 * (g.ThetaRoot + g.ThetaTip)
			g.LiftSlope0 = geomObj.RunMethod("optDouble", Array("liftSlope0", 5.73))
			g.Cd0 = geomObj.RunMethod("optDouble", Array("cd0", 0.01))
			g.TipLossMode = geomObj.RunMethod("optString", Array("tipLossMode", "sissingh"))
			g.TipLossB = geomObj.RunMethod("optDouble", Array("tipLossB", 0.97))
			g.UsePrandtlGlauert = geomObj.RunMethod("optBoolean", Array("usePrandtlGlauert", False))
			Dim nomRpm As Double = geomObj.RunMethod("optDouble", Array("nominalRpm", -1.0))
			If nomRpm <= 0 Then nomRpm = geomObj.RunMethod("optDouble", Array("rpm", -1.0))
			If nomRpm <= 0 Then nomRpm = DefaultNominalRPM(g.Radius)
			g.NominalRPM = nomRpm
			g.RPM = nomRpm
			If IsImportedGeometryValid(g) Then
				imported.Add(zBETEngine.ResolveSolidity(g))
			End If
		Next
	Catch
		Log("ParseDatabaseJSON error: " & LastException.Message)
	End Try
	Return imported
End Sub

' Removes a UTF-8 byte-order mark (U+FEFF) that some editors and exporters put at the start of a file.
Public Sub StripBom(Text As String) As String
	Dim t As String = Text
	Do While t.Length > 0 And Asc(t.CharAt(0)) = 0xFEFF
		t = t.SubString(1)
	Loop
	Return t
End Sub

Public Sub ParseDatabaseUniversal(Text As String) As List
	Dim t As String = StripBom(Text).Trim
	If t.StartsWith("{") Or t.StartsWith("[") Then
		Dim res As List = ParseDatabaseJSON(t)
		If res.IsInitialized And res.Size > 0 Then Return res
	End If
	Return ParseDatabaseText(t)
End Sub

Public Sub ParseDatabaseText(Text As String) As List
	Dim imported As List
	imported.Initialize
	Dim lines() As String = Regex.Split("\r?\n", StripBom(Text))
	Dim version As Int = 0
	For i = 0 To lines.Length - 1
		Dim line As String = lines(i).Trim
		If line = "" Then Continue
		Dim parts() As String = Regex.Split("\|", line)
		If parts.Length >= 2 And parts(0) = SCHEMA_TAG Then
			version = parts(1)
		Else If (version = 2 Or version = 3) And parts.Length >= 14 And parts(0) = "R" Then
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
	Dim needRecovery As Boolean = False
	If File.Exists(GetDataDir, FILENAME) Then
		Try
			Dim text As String = StripBom(File.ReadString(GetDataDir, FILENAME))
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
			If Rotors.Size = 0 Then needRecovery = True
		Catch
			Log("Rotor database could not be read: " & LastException.Message)
			needRecovery = True
		End Try
		If needRecovery Then
			' Never overwrite an unreadable library: keep a timestamped copy first.
			BackupCorruptFile
			Rotors = RecoverFromBackup
		End If
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

' Copies the unreadable library to rotors_db.corrupt-<timestamp>.txt.
Private Sub BackupCorruptFile
	Try
		If File.Exists(GetDataDir, FILENAME) Then
			File.Copy(GetDataDir, FILENAME, GetDataDir, "rotors_db.corrupt-" & DateTime.Now & ".txt")
		End If
	Catch
		Log("Corrupt library backup failed: " & LastException.Message)
	End Try
End Sub

' Uses the rolling backup when it parses; otherwise factory presets. The corrupt copy already exists.
Private Sub RecoverFromBackup As List
	Dim res As List
	res.Initialize
	Try
		If File.Exists(GetDataDir, BACKUP_FILENAME) Then
			res = ParseDatabaseText(File.ReadString(GetDataDir, BACKUP_FILENAME))
		End If
	Catch
		Log("Rolling backup unreadable: " & LastException.Message)
	End Try
	If res.Size = 0 Then res = CreateDefaultPresets
	File.WriteString(GetDataDir, FILENAME, SerializeList(res))
	Return res
End Sub

Private Sub SerializeList(items As List) As String
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append(SCHEMA_TAG).Append("|").Append(SCHEMA_VERSION).Append(CRLF)
	For i = 0 To items.Size - 1
		sb.Append(SerializeRotor(items.Get(i))).Append(CRLF)
	Next
	Return sb.ToString
End Sub

' Rolling backup: the previous readable library is kept as rotors_db.bak before each save.
Public Sub SaveRotors
	Try
		If File.Exists(GetDataDir, FILENAME) Then
			Dim old As String = File.ReadString(GetDataDir, FILENAME)
			If StripBom(old).StartsWith(SCHEMA_TAG & "|") Then File.WriteString(GetDataDir, BACKUP_FILENAME, old)
		End If
	Catch
		Log("Rolling backup skipped: " & LastException.Message)
	End Try
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

' Returns a clone of the rotor at index (uninitialized geometry when out of range).
Public Sub CloneRotorAt(index As Int) As RotorGeometry
	Dim none As RotorGeometry
	If index < 0 Or index >= Rotors.Size Then Return none
	Return zBETEngine.CloneGeometry(Rotors.Get(index))
End Sub

' Re-inserts a deleted rotor at its old position and makes it active (Undo delete).
Public Sub InsertRotorAt(index As Int, g As RotorGeometry)
	Dim pos As Int = Max(0, Min(index, Rotors.Size))
	g.Name = MakeUniqueName(g.Name)
	Rotors.InsertAt(pos, zBETEngine.CloneGeometry(g))
	ActiveIndex = pos
	SaveRotors
	SaveActiveIndex
End Sub

Public Sub IsFactoryPresetAt(index As Int) As Boolean
	If index < 0 Or index >= Rotors.Size Then Return False
	Dim g As RotorGeometry = Rotors.Get(index)
	Return IsFactoryPresetName(g.Name)
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

' Import rename rule shared with web (storage.ts uniqueImportedName):
' "Name", then "Name (Imported)", "Name (2)", "Name (3)"... within 32 characters.
Public Sub MakeImportedName(BaseName As String) As String
	Dim clean As String = CleanName(BaseName)
	Dim candidate As String = clean
	Dim counter As Int = 1
	Do While FindRotorByName(candidate) >= 0
		Dim tail As String
		If counter = 1 Then tail = " (Imported)" Else tail = " (" & counter & ")"
		Dim stem As String = clean
		If stem.Length > 32 - tail.Length Then stem = stem.SubString2(0, 32 - tail.Length)
		candidate = stem.Trim & tail
		counter = counter + 1
	Loop
	Return candidate
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
					g.Name = MakeImportedName(g.Name)
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

' decisions: one String per imported rotor ("rename", "replace" or "skip"; "" = no conflict decision).
' A conflict without a decision is renamed. LastImportFirstIndex receives the library index of the
' first imported or replaced rotor (-1 when none). Returns number imported or replaced.
Public Sub MergeImportedRotorsEach(imported As List, decisions As List) As Int
	Dim added As Int = 0
	LastImportFirstIndex = -1
	For i = 0 To imported.Size - 1
		Dim g As RotorGeometry = imported.Get(i)
		Dim decision As String = ""
		If i < decisions.Size Then decision = decisions.Get(i)
		Dim existing As Int = FindRotorByName(g.Name)
		Dim target As Int = -1
		If existing < 0 Then
			Rotors.Add(zBETEngine.CloneGeometry(g))
			target = Rotors.Size - 1
		Else If decision = "skip" Then
			' keep the local rotor
		Else If decision = "replace" Then
			UpdateRotor(existing, g)
			target = existing
		Else
			g.Name = MakeImportedName(g.Name)
			Rotors.Add(zBETEngine.CloneGeometry(g))
			target = Rotors.Size - 1
		End If
		If target >= 0 Then
			added = added + 1
			If LastImportFirstIndex < 0 Then LastImportFirstIndex = target
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

' ---------------------------------------------------------------------------
' Unsaved-geometry draft (survives process death; separate from the library file)
' ---------------------------------------------------------------------------
Public Sub SaveDraft(g As RotorGeometry, baseIndex As Int)
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append(SCHEMA_TAG).Append("|").Append(SCHEMA_VERSION).Append(CRLF)
	sb.Append(SerializeRotor(g)).Append(CRLF)
	sb.Append("BASE|").Append(baseIndex).Append(CRLF)
	File.WriteString(GetDataDir, "geometry_draft.txt", sb.ToString)
End Sub

Public Sub ClearDraft
	If File.Exists(GetDataDir, "geometry_draft.txt") Then File.Delete(GetDataDir, "geometry_draft.txt")
End Sub

' Returns the draft geometry (Null-initialized when none). baseIndex(0) receives the library index it was based on.
Public Sub LoadDraft(baseIndex() As Int) As RotorGeometry
	Dim none As RotorGeometry
	If File.Exists(GetDataDir, "geometry_draft.txt") = False Then Return none
	Try
		Dim text As String = File.ReadString(GetDataDir, "geometry_draft.txt")
		Dim list As List = ParseDatabaseText(text)
		If list.Size = 0 Then Return none
		For Each ln As String In Regex.Split("\r?\n", text)
			If ln.StartsWith("BASE|") Then baseIndex(0) = ln.SubString(5).Trim
		Next
		Return list.Get(0)
	Catch
		Return none
	End Try
End Sub
