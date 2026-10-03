B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=Class
Version=13
@EndOfDesignText@
' clsSheet.bas - themed overlay sheets (help, choice, confirm, message). No system dialogs.
' One overlay at a time. Opening a new one cancels the previous one (its awaiting caller gets the cancel value).
'
' Usage:
'   Dim sheet As clsSheet : sheet.Initialize(rootPanel) : sheet.SetTheme(isLight, paletteMap)
'   sheet.ShowHelp("CT")
'   Wait For (sheet.ShowChoice("Inflow Model", Array As String("Uniform|Momentum theory", "Drees"), 0)) Complete (idx As Int)
'   Wait For (sheet.ShowConfirm("Delete", "Delete this rotor?", "Delete", "Cancel", "", True)) Complete (r As Int)
'   If r = DialogResponse.POSITIVE Then ...
'   Activity_KeyPress: If KeyCode = KeyCodes.KEYCODE_BACK And sheet.CloseTop Then Return True

Sub Class_Globals
	Private mParent As Panel
	Private scrim As Panel
	Private card As Panel
	Private mOpen As Boolean
	Private mClosing As Boolean
	Private mPending As Boolean
	Private mBottom As Boolean
	Private mCancel As Int
	Private mGen As Int
	Private mLight As Boolean
	Private cScrim As Int = 0xB0000000
	Private cCard As Int = 0xFF121925
	Private cTitle As Int = 0xFFFFFFFF
	Private cText As Int = 0xFFE2E8F0
	Private cMuted As Int = 0xFF94A3B8
	Private cAccent As Int = 0xFF00E5FF
	Private cGreen As Int = 0xFF00E0A0
	Private cAmber As Int = 0xFFFFB347
	Private cRed As Int = 0xFFFF5A52
	Private cDivider As Int = 0xFF2A3548
	Private cCode As Int = 0xFF0B101A
	Private mEdt As EditText
	Private mInputText As String
	Private mMaxLen As Int
	Private mNote As String
End Sub

Public Sub Initialize(Parent As Panel)
	mParent = Parent
End Sub

' palette keys (all optional): scrim, card, title, text, muted, accent, green, amber, red, divider, code
Public Sub SetTheme(isLight As Boolean, palette As Map)
	mLight = isLight
	If isLight Then
		cScrim = 0x66101828
		cCard = 0xFFFFFFFF
		cTitle = 0xFF0B1220
		cText = 0xFF172033
		cMuted = 0xFF667085
		cAccent = 0xFF007F95
		cGreen = 0xFF007A52
		cAmber = 0xFFAA5A00
		cRed = 0xFFB42318
		cDivider = 0xFFD5DCE6
		cCode = 0xFFEEF3F8
	Else
		cScrim = 0xB0000000
		cCard = 0xFF121925
		cTitle = 0xFFFFFFFF
		cText = 0xFFE2E8F0
		cMuted = 0xFF94A3B8
		cAccent = 0xFF00E5FF
		cGreen = 0xFF00E0A0
		cAmber = 0xFFFFB347
		cRed = 0xFFFF5A52
		cDivider = 0xFF2A3548
		cCode = 0xFF0B101A
	End If
	If palette.IsInitialized Then
		cScrim = palette.GetDefault("scrim", cScrim)
		cCard = palette.GetDefault("card", cCard)
		cTitle = palette.GetDefault("title", cTitle)
		cText = palette.GetDefault("text", cText)
		cMuted = palette.GetDefault("muted", cMuted)
		cAccent = palette.GetDefault("accent", cAccent)
		cGreen = palette.GetDefault("green", cGreen)
		cAmber = palette.GetDefault("amber", cAmber)
		cRed = palette.GetDefault("red", cRed)
		cDivider = palette.GetDefault("divider", cDivider)
		cCode = palette.GetDefault("code", cCode)
	End If
End Sub

Public Sub IsOpen As Boolean
	Return mOpen
End Sub

' For the back key: closes the overlay (cancel result). Returns True if one was open.
Public Sub CloseTop As Boolean
	If mOpen = False Then Return False
	If mClosing = False Then Dismiss(mCancel)
	Return True
End Sub

' Instant close without animation (e.g. on orientation change).
Public Sub CloseAll
	If mOpen = False Then Return
	Resolve(mCancel)
	mGen = mGen + 1
	If scrim.IsInitialized Then scrim.RemoveView
	mOpen = False
	mClosing = False
End Sub

' ---------------------------------------------------------------- public sheets

' Bottom sheet: RichLabel full title + symbol, body, equation, typical range, unit hint.
Public Sub ShowHelp(key As String)
	Begin(True)
	mCancel = 0
	Dim pad As Int = 20dip
	Dim cw As Int = Min(mParent.Width, 560dip)
	Dim iw As Int = cw - 2 * pad
	Dim header As Panel = BuildHeader(cw, RotorNames.PlainLabel(key, 0), RotorNames.RichLabel(key, 0), True, True)
	Dim body As Panel
	body.Initialize("")
	body.Color = Colors.Transparent
	Dim y As Int = 4dip
	Dim txt As String = RotorNames.HelpBody(key)
	If txt.Length > 0 Then
		Dim lb As Label = MkLabel(txt, 15, cText, False)
		lb.Text = RotorNames.RichText(txt)
		y = y + PlaceText(body, lb, txt, pad, y, iw) + 14dip
	End If
	Dim eq As String = RotorNames.HelpEquation(key)
	If eq.Length > 0 Then
		Dim box As Panel
		box.Initialize("")
		Dim bd As ColorDrawable
		bd.Initialize2(cCode, 10dip, 1dip, cDivider)
		box.Background = bd
		body.AddView(box, pad, y, iw, 10dip)
		Dim eqSp As Float = 15
		If eq.Length > 28 Then eqSp = 13.5
		Dim le As Label = MkLabel(eq, eqSp, cAccent, True)
		le.Typeface = Typeface.MONOSPACE
		le.Text = RotorNames.RichText(eq)
		Dim eh As Int = PlaceText(box, le, eq, 12dip, 10dip, iw - 24dip)
		box.Height = eh + 20dip
		y = y + box.Height + 14dip
	End If
	Dim rng As String = RotorNames.HelpRange(key)
	If rng.Length > 0 Then
		y = y + PlaceText(body, MkLabel("Typical range", 15, cGreen, True), "Typical range", pad, y, iw) + 2dip
		y = y + PlaceText(body, MkLabel(rng, 15, cText, False), rng, pad, y, iw) + 12dip
	End If
	Dim u As String = RotorNames.UnitHint(key)
	If u.Length > 0 Then
		If u = "-" Then u = "dimensionless"
		y = y + PlaceText(body, MkLabel("Unit", 15, cAmber, True), "Unit", pad, y, iw) + 2dip
		y = y + PlaceText(body, MkLabel(u, 15, cText, False), u, pad, y, iw) + 12dip
	End If
	body.Height = y + 16dip
	Dim nf As Panel
	Present(cw, header, body, nf)
End Sub

' Optional muted note shown above the rows of the NEXT choice/menu sheet (cleared after use).
Public Sub SetNote(note As String)
	mNote = note
End Sub

' items: "Primary" or "Primary|secondary line". Returns chosen index or -1 (cancel / scrim / back).
Public Sub ShowChoice(title As String, items As List, selectedIndex As Int) As ResumableSub
	Dim noColors As List
	BuildChoice(title, items, selectedIndex, True, noColors)
	mPending = True
	Wait For Sheet_Result(v As Int)
	Return v
End Sub

' Overflow-style menu: no Cancel footer, no selection tick, close button in the header. Returns index or -1.
Public Sub ShowMenu(title As String, items As List) As ResumableSub
	Dim noColors As List
	BuildChoice(title, items, -1, False, noColors)
	mPending = True
	Wait For Sheet_Result(v As Int)
	Return v
End Sub

' Choice with up to four ARGB colour swatches per item. colors: List of Int() (same size as items).
Public Sub ShowChoiceSwatches(title As String, items As List, selectedIndex As Int, swatchList As List) As ResumableSub
	BuildChoice(title, items, selectedIndex, True, swatchList)
	mPending = True
	Wait For Sheet_Result(v As Int)
	Return v
End Sub

Private Sub BuildChoice(title As String, items As List, selectedIndex As Int, withCancel As Boolean, swatchList As List)
	Begin(True)
	mCancel = -1
	Dim pad As Int = 20dip
	Dim cw As Int = Min(mParent.Width, 560dip)
	Dim header As Panel = BuildHeader(cw, title, RotorNames.RichText(title), (withCancel = False), True)
	Dim body As Panel
	body.Initialize("")
	body.Color = Colors.Transparent
	Dim y As Int = 0
	If mNote.Length > 0 Then
		Dim ln As Label = MkLabel(mNote, 15, cMuted, False)
		ln.Text = RotorNames.RichText(mNote)
		y = PlaceText(body, ln, mNote, pad, 0, cw - 2 * pad) + 8dip
		mNote = ""
	End If
	Dim swW As Int = 0
	If swatchList.IsInitialized Then swW = 4 * 18dip + 8dip
	Dim textW As Int = cw - pad - 56dip - swW
	For i = 0 To items.Size - 1
		Dim parts() As String = Regex.Split("\|", items.Get(i))
		Dim prim As String = parts(0).Trim
		Dim sec As String = ""
		If parts.Length > 1 Then sec = parts(1).Trim
		Dim sel As Boolean = (i = selectedIndex)
		Dim row As Panel
		row.Initialize("rowItem")
		row.Tag = i
		Dim rowBg As Int = 0
		If sel Then rowBg = Bit.Or(Bit.And(cAccent, 0xFFFFFF), 0x2A000000)
		body.AddView(row, 0, y, cw, 56dip)
		ApplyBg(row, rowBg, Mix(cCard, cText, 0.14), 0)
		Dim c1 As Int = cText
		If sel Then c1 = cAccent
		Dim l1 As Label = MkLabel(prim, 16, c1, sel)
		l1.Text = RotorNames.RichText(prim)
		Dim h1 As Int = PlaceText(row, l1, prim, pad, 0, textW)
		Dim contentH As Int = h1
		Dim l2 As Label
		Dim h2 As Int = 0
		If sec.Length > 0 Then
			l2 = MkLabel(sec, 15, cMuted, False)
			l2.Text = RotorNames.RichText(sec)
			h2 = PlaceText(row, l2, sec, pad, 0, textW)
			contentH = h1 + 2dip + h2
		End If
		Dim rowH As Int = Max(contentH + 24dip, 56dip)
		Dim off As Int = (rowH - contentH) / 2
		l1.Top = off
		If h2 > 0 Then l2.Top = off + h1 + 2dip
		If swW > 0 Then
			Dim cl() As Int = swatchList.Get(i)
			For k = 0 To Min(3, cl.Length - 1)
				Dim dot As Panel
				dot.Initialize("")
				Dim dd As ColorDrawable
				dd.Initialize2(cl(k), 7dip, 1dip, cDivider)
				dot.Background = dd
				row.AddView(dot, pad + textW + 4dip + k * 18dip, (rowH - 14dip) / 2, 14dip, 14dip)
			Next
		End If
		If sel Then
			Dim lc As Label = MkLabel(Chr(0x2713), 20, cAccent, True)
			lc.Gravity = Gravity.CENTER
			row.AddView(lc, cw - 52dip, (rowH - 32dip) / 2, 40dip, 32dip)
		End If
		If i < items.Size - 1 Then
			Dim dv As Panel
			dv.Initialize("")
			dv.Color = cDivider
			row.AddView(dv, pad, rowH - 1dip, cw - 2 * pad, 1dip)
		End If
		row.Height = rowH
		y = y + rowH
	Next
	body.Height = y
	Dim footer As Panel
	If withCancel Then
		footer.Initialize("")
		footer.Color = Colors.Transparent
		Dim fl As Panel
		fl.Initialize("")
		fl.Color = cDivider
		footer.AddView(fl, 0, 0, cw, 1dip)
		footer.AddView(MkBtn("Cancel", -1, Mix(cCard, cText, 0.08), cText, False, "btnCancel"), pad, 10dip, cw - 2 * pad, 48dip)
		footer.Height = 68dip
	Else
		body.Height = y + 12dip
	End If
	Present(cw, header, body, footer)
End Sub

' Returns DialogResponse.POSITIVE / NEGATIVE / CANCEL (neutral button, scrim tap and back give CANCEL).
Public Sub ShowConfirm(title As String, message As String, positive As String, negative As String, neutral As String, destructive As Boolean) As ResumableSub
	BuildConfirm(title, message, positive, negative, neutral, destructive)
	mPending = True
	Wait For Sheet_Result(v As Int)
	Return v
End Sub

' Single-line text prompt. Returns the entered text, or "" when cancelled / empty.
Public Sub ShowInput(title As String, hint As String, prefill As String, positive As String, maxLen As Int) As ResumableSub
	Begin(False)
	mCancel = DialogResponse.CANCEL
	mMaxLen = maxLen
	mInputText = ""
	Dim pad As Int = 20dip
	Dim cw As Int = Min(mParent.Width - 32dip, 420dip)
	Dim iw As Int = cw - 2 * pad
	Dim header As Panel = BuildHeader(cw, title, RotorNames.RichText(title), False, False)
	Dim body As Panel
	body.Initialize("")
	body.Color = Colors.Transparent
	Dim y As Int = 0
	If hint.Length > 0 Then y = PlaceText(body, MkLabel(hint, 15, cMuted, False), hint, pad, 0, iw) + 8dip
	mEdt.Initialize("edtIn")
	mEdt.SingleLine = True
	mEdt.TextSize = 16 * SheetK
	mEdt.TextColor = cText
	mEdt.ForceDoneButton = True
	Dim ebg As ColorDrawable
	ebg.Initialize2(cCode, 10dip, 1dip, cDivider)
	mEdt.Background = ebg
	mEdt.Padding = Array As Int(12dip, 0, 12dip, 0)
	mEdt.Text = prefill
	body.AddView(mEdt, pad, y, iw, 48dip)
	body.Height = y + 48dip + 12dip
	Dim footer As Panel
	footer.Initialize("")
	footer.Color = Colors.Transparent
	Dim gap As Int = 8dip
	Dim bw As Int = (iw - gap) / 2
	footer.AddView(MkBtn("Cancel", DialogResponse.NEGATIVE, Mix(cCard, cText, 0.08), cText, False, "btnAct"), pad, 8dip, bw, 48dip)
	footer.AddView(MkBtn(positive, DialogResponse.POSITIVE, cAccent, Contrast(cAccent), True, "btnAct"), pad + bw + gap, 8dip, bw, 48dip)
	footer.Height = 8dip + 48dip + 20dip
	Present(cw, header, body, footer)
	mEdt.SelectAll
	mPending = True
	Wait For Sheet_Result(v As Int)
	If v = DialogResponse.POSITIVE Then Return mInputText
	Return ""
End Sub

Private Sub edtIn_TextChanged(Old As String, New As String)
	If mMaxLen > 0 And New.Length > mMaxLen Then
		mEdt.Text = New.SubString2(0, mMaxLen)
		mEdt.SelectionStart = mMaxLen
	End If
End Sub

Private Sub edtIn_EnterPressed
	If mEdt.IsInitialized Then mInputText = mEdt.Text.Trim
	Dismiss(DialogResponse.POSITIVE)
End Sub

Public Sub ShowMessage(title As String, message As String)
	BuildConfirm(title, message, "OK", "", "", False)
End Sub

' ---------------------------------------------------------------- internals

Private Sub BuildConfirm(title As String, message As String, positive As String, negative As String, neutral As String, destructive As Boolean)
	Begin(False)
	mCancel = DialogResponse.CANCEL
	Dim pad As Int = 20dip
	Dim cw As Int = Min(mParent.Width - 32dip, 420dip)
	Dim iw As Int = cw - 2 * pad
	Dim header As Panel = BuildHeader(cw, title, RotorNames.RichText(title), False, False)
	Dim body As Panel
	body.Initialize("")
	body.Color = Colors.Transparent
	Dim y As Int = 0
	If message.Length > 0 Then
		Dim lm As Label = MkLabel(message, 16, cText, False)
		lm.Text = RotorNames.RichText(message)
		y = PlaceText(body, lm, message, pad, 0, iw) + 8dip
	End If
	body.Height = y + 8dip
	' buttons, in horizontal order: neutral, negative, positive
	Dim texts As List
	texts.Initialize
	Dim vals As List
	vals.Initialize
	Dim kinds As List
	kinds.Initialize
	If neutral.Length > 0 Then
		texts.Add(neutral)
		vals.Add(DialogResponse.CANCEL)
		kinds.Add(0)
	End If
	If negative.Length > 0 Then
		texts.Add(negative)
		vals.Add(DialogResponse.NEGATIVE)
		kinds.Add(0)
	End If
	If positive.Length > 0 Then
		texts.Add(positive)
		vals.Add(DialogResponse.POSITIVE)
		kinds.Add(1)
	End If
	Dim n As Int = texts.Size
	Dim gap As Int = 8dip
	Dim horizontal As Boolean = (n <= 2 And (iw - gap * (n - 1)) / Max(n, 1) >= 120dip)
	Dim footer As Panel
	footer.Initialize("")
	footer.Color = Colors.Transparent
	Dim posBg As Int = cAccent
	If destructive Then posBg = cRed
	Dim secBg As Int = Mix(cCard, cText, 0.08)
	For j = 0 To n - 1
		Dim b As Button
		If kinds.Get(j) = 1 Then
			b = MkBtn(texts.Get(j), vals.Get(j), posBg, Contrast(posBg), True, "btnAct")
		Else
			b = MkBtn(texts.Get(j), vals.Get(j), secBg, cText, False, "btnAct")
		End If
		If horizontal Then
			Dim bw As Int = (iw - gap * (n - 1)) / n
			footer.AddView(b, pad + j * (bw + gap), 8dip, bw, 48dip)
		Else
			' vertical: positive first
			footer.AddView(b, pad, 8dip + (n - 1 - j) * (48dip + gap), iw, 48dip)
		End If
	Next
	If horizontal Then
		footer.Height = 8dip + 48dip + 20dip
	Else
		footer.Height = 8dip + n * 48dip + (n - 1) * gap + 20dip
	End If
	Present(cw, header, body, footer)
End Sub

Private Sub Begin(bottom As Boolean)
	If mOpen Then
		Resolve(mCancel)
		If scrim.IsInitialized Then scrim.RemoveView
		mOpen = False
	End If
	mGen = mGen + 1
	mClosing = False
	mBottom = bottom
	scrim.Initialize("scrim")
	scrim.Color = 0
	mParent.AddView(scrim, 0, 0, mParent.Width, mParent.Height)
	mOpen = True
End Sub

Private Sub Resolve(v As Int)
	If mPending Then
		mPending = False
		CallSubDelayed2(Me, "Sheet_Result", v)
	End If
End Sub

Private Sub Dismiss(v As Int)
	If mOpen = False Or mClosing Then Return
	mClosing = True
	Resolve(v)
	Dim g As Int = mGen
	If mBottom Then
		card.SetLayoutAnimated(160, card.Left, mParent.Height, card.Width, card.Height)
	Else
		card.SetVisibleAnimated(160, False)
	End If
	scrim.SetColorAnimated(160, cScrim, 0)
	Sleep(160)
	If g = mGen And mOpen Then
		scrim.RemoveView
		mOpen = False
		mClosing = False
	End If
End Sub

' Lays out header + (scrollable) body + footer in a card and animates it in.
Private Sub Present(cw As Int, header As Panel, body As Panel, footer As Panel)
	Dim ph As Int = mParent.Height
	Dim hh As Int = header.Height
	Dim bh As Int = body.Height
	Dim fh As Int = 0
	If footer.IsInitialized Then fh = footer.Height
	Dim maxTotal As Int
	If mBottom Then
		maxTotal = ph * 0.9
	Else
		maxTotal = ph - 32dip
	End If
	Dim bodyH As Int = Max(Min(bh, maxTotal - hh - fh), 48dip)
	Dim total As Int = hh + bodyH + fh
	Dim extra As Int = 0
	If mBottom Then extra = 24dip
	Dim bg As ColorDrawable
	bg.Initialize2(cCard, 20dip, 0, 0)
	card.Initialize("card")
	card.Background = bg
	Dim cl As Int = (mParent.Width - cw) / 2
	Dim endTop As Int
	If mBottom Then
		endTop = ph - total
		scrim.AddView(card, cl, ph, cw, total + extra)
	Else
		endTop = (ph - total) / 2
		scrim.AddView(card, cl, endTop, cw, total)
		card.Visible = False
	End If
	card.AddView(header, 0, 0, cw, hh)
	If bh > bodyH Then
		Dim sv As ScrollView
		sv.Initialize(bh)
		sv.Color = Colors.Transparent
		sv.Panel.Color = Colors.Transparent
		sv.Panel.AddView(body, 0, 0, cw, bh)
		card.AddView(sv, 0, hh, cw, bodyH)
	Else
		card.AddView(body, 0, hh, cw, bh)
	End If
	If footer.IsInitialized Then card.AddView(footer, 0, hh + bodyH, cw, fh)
	scrim.SetColorAnimated(180, 0, cScrim)
	If mBottom Then
		card.SetLayoutAnimated(180, cl, endTop, cw, total + extra)
	Else
		card.SetVisibleAnimated(180, True)
	End If
End Sub

Private Sub BuildHeader(cw As Int, title As String, rich As CSBuilder, withClose As Boolean, withHandle As Boolean) As Panel
	Dim pad As Int = 20dip
	Dim h As Panel
	h.Initialize("")
	h.Color = Colors.Transparent
	Dim top As Int = 16dip
	If withHandle Then
		Dim handle As Panel
		handle.Initialize("")
		Dim hd As ColorDrawable
		hd.Initialize2(cDivider, 2dip, 0, 0)
		handle.Background = hd
		h.AddView(handle, (cw - 40dip) / 2, 8dip, 40dip, 4dip)
		top = 22dip
	End If
	Dim tw As Int = cw - 2 * pad
	If withClose Then tw = cw - pad - 56dip
	Dim th As Int = 0
	Dim lt As Label
	If title.Length > 0 Then
		lt = MkLabel("", 18, cTitle, True)
		lt.Text = rich
		th = PlaceText(h, lt, title, pad, top, tw)
	End If
	Dim hh As Int = top + th + 10dip
	If withClose Then
		Dim bx As Button = MkBtn(Chr(0xD7), 0, 0, cMuted, False, "btnCloseX")
		bx.TextSize = 26
		h.AddView(bx, cw - 56dip, top - 8dip, 48dip, 48dip)
		If title.Length > 0 And th < 48dip Then lt.Top = top - 8dip + (48dip - th) / 2
		hh = Max(hh, top + 44dip)
	End If
	h.Height = hh
	Return h
End Sub

' Type scale by screen width (compact at 320dp) and a clamp of the system font scale to 1.15 for sheet text.
Private Sub SheetK As Double
	Dim wdp As Double = mParent.Width / 1dip
	Dim k As Double = 1.0
	If wdp <= 340 Then
		k = 0.86
	Else If wdp <= 380 Then
		k = 0.93
	Else If wdp >= 600 Then
		k = 1.06
	End If
	Try
		Dim ctx As JavaObject
		ctx.InitializeContext
		Dim cfg As JavaObject = ctx.RunMethodJO("getResources", Null).RunMethodJO("getConfiguration", Null)
		Dim fs As Double = cfg.GetField("fontScale")
		If fs > 1.15 Then k = k * 1.15 / fs
	Catch
		Log("fontScale: " & LastException.Message)
	End Try
	Return k
End Sub

Private Sub MkLabel(txt As String, sp As Float, col As Int, bold As Boolean) As Label
	Dim l As Label
	l.Initialize("")
	l.TextSize = sp * SheetK
	l.TextColor = col
	If bold Then
		l.Typeface = Typeface.DEFAULT_BOLD
	Else
		l.Typeface = Typeface.DEFAULT
	End If
	l.Gravity = Gravity.LEFT + Gravity.TOP
	l.Text = txt
	Return l
End Sub

' Adds the label to p with width w, measures the real wrapped height (font scale aware), sizes it, returns height.
Private Sub PlaceText(p As Panel, l As Label, plain As String, x As Int, y As Int, w As Int) As Int
	p.AddView(l, x, y, w, 10dip)
	Dim jo As JavaObject = l
	Dim vw As JavaObject
	vw.InitializeStatic("android.view.View$MeasureSpec")
	jo.RunMethod("measure", Array(vw.RunMethod("makeMeasureSpec", Array(w, 1073741824)), vw.RunMethod("makeMeasureSpec", Array(0, 0))))
	Dim h As Int = jo.RunMethod("getMeasuredHeight", Null) + 4dip
	l.Height = h
	Return h
End Sub

Private Sub MkBtn(txt As String, tag As Int, bg As Int, fg As Int, bold As Boolean, evt As String) As Button
	Dim b As Button
	b.Initialize(evt)
	b.Text = txt
	b.TextSize = 16 * SheetK
	b.TextColor = fg
	If bold Then
		b.Typeface = Typeface.DEFAULT_BOLD
	Else
		b.Typeface = Typeface.DEFAULT
	End If
	b.Gravity = Gravity.CENTER
	b.Padding = Array As Int(8dip, 0, 8dip, 0)
	Dim base As Int = bg
	If bg = 0 Then base = cCard
	ApplyBg(b, bg, Mix(base, cText, 0.18), 12dip)
	b.Tag = tag
	Return b
End Sub

Private Sub ApplyBg(v As View, bg As Int, pressed As Int, radius As Int)
	v.Background = RoundBg(bg, pressed, radius)
	RotorNames.AddRipple(v, Bit.Or(0x40000000, Bit.And(cAccent, 0xFFFFFF)))
End Sub

Private Sub RoundBg(bg As Int, pressed As Int, radius As Int) As StateListDrawable
	Dim n As ColorDrawable
	Dim p As ColorDrawable
	n.Initialize2(bg, radius, 0, 0)
	p.Initialize2(pressed, radius, 0, 0)
	Dim s As StateListDrawable
	s.Initialize
	s.AddState(s.State_Pressed, p)
	s.AddCatchAllState(n)
	Return s
End Sub

Private Sub Mix(c1 As Int, c2 As Int, t As Float) As Int
	Dim r As Int = Bit.And(Bit.ShiftRight(c1, 16), 255) * (1 - t) + Bit.And(Bit.ShiftRight(c2, 16), 255) * t
	Dim g As Int = Bit.And(Bit.ShiftRight(c1, 8), 255) * (1 - t) + Bit.And(Bit.ShiftRight(c2, 8), 255) * t
	Dim b As Int = Bit.And(c1, 255) * (1 - t) + Bit.And(c2, 255) * t
	Return Colors.RGB(r, g, b)
End Sub

Private Sub Contrast(bg As Int) As Int
	Dim lum As Double = 0.299 * Bit.And(Bit.ShiftRight(bg, 16), 255) + 0.587 * Bit.And(Bit.ShiftRight(bg, 8), 255) + 0.114 * Bit.And(bg, 255)
	If lum > 150 Then Return 0xFF0B1220
	Return Colors.White
End Sub

' ---------------------------------------------------------------- events

Private Sub scrim_Click
	If mClosing = False Then Dismiss(mCancel)
End Sub

Private Sub card_Click
	' swallow taps on the card
End Sub

Private Sub rowItem_Click
	Dim p As Panel = Sender
	Dim idx As Int = p.Tag
	Dismiss(idx)
End Sub

Private Sub btnAct_Click
	Dim b As Button = Sender
	Dim v As Int = b.Tag
	If v = DialogResponse.POSITIVE And mEdt.IsInitialized Then mInputText = mEdt.Text.Trim
	Dismiss(v)
End Sub

Private Sub btnCancel_Click
	Dismiss(mCancel)
End Sub

Private Sub btnCloseX_Click
	Dismiss(mCancel)
End Sub
