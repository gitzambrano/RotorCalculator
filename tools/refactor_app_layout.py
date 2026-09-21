import re

def refactor_b4a():
    file_path = r"C:\Projetos\RotorCalculator\RotorCalculator.b4a"
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. In Globals: remove root and imeInsets, remove pnlTabsBar
    code = re.sub(
        r"Sub Globals.*?(?=Private pnlTopBar As Panel)",
        """Sub Globals
\t
\t' Top Action Bar & Tabs (Unified Cockpit Header)
\t""",
        code,
        flags=re.DOTALL
    )

    # 2. Replace Activity_Create, BuildTopBar, BuildTabsBar, BuildViewPager
    old_setup_pattern = re.compile(
        r"Sub Activity_Create\(FirstTime As Boolean\).*?Private Sub BuildPageGeom\(parent As Panel\)",
        re.DOTALL
    )

    new_setup = """Sub Activity_Create(FirstTime As Boolean)
\t
\t' Initialize Independent Sub-Modules
\tIf FirstTime Then
\t\tRotorStorage.Initialize(rp)
\t\tRotorPopups.Initialize
\t\tActiveGeom = RotorStorage.GetActiveRotor
\t\tActiveCond = zBETEngine.CreateDefaultCondition
\tEnd If
\t
\tActivity.Color = ColorBg
\t
\t' Adaptive Scaling Factor
\tsc = Max(0.85, Min(1.35, 100%x / 360dip))
\t
\tDim headerH As Int = 102dip * sc
\tDim pagerH As Int = 100%y - headerH
\t
\t' Build Application Layout
\tBuildUnifiedHeader(headerH)
\tBuildViewPager(headerH, pagerH)
\t
\t' Populate UI & Execute Initial Calculation
\tLoadRotorDataToFields(ActiveGeom)
\tRecalculateRotor
\t
End Sub

' Builds Unified Cockpit Header (Icon + Xenara Font Title + 3-Dot Menu + Integrated Tabs)
Private Sub BuildUnifiedHeader(headerH As Int)
\tpnlTopBar.Initialize("pnlTopBar")
\tpnlTopBar.Color = ColorPnlTitle
\tActivity.AddView(pnlTopBar, 0, 0, 100%x, headerH)
\t
\t' 1. Left Stylized BEMT Rotor Icon
\tDim imgIcon As ImageView
\tDim bmpIcon As Bitmap
\tbmpIcon.Initialize(File.DirAssets, "icon.png")
\timgIcon.Initialize("")
\timgIcon.Bitmap = bmpIcon
\timgIcon.Gravity = Gravity.FILL
\tpnlTopBar.AddView(imgIcon, 4%x, 9dip * sc, 38dip * sc, 38dip * sc)
\t
\t' 2. App Title with Xenara-Bold Aviation Typography
\tlblAppTitle.Initialize("")
\tlblAppTitle.Text = "RotorCalculator"
\tlblAppTitle.TextColor = Colors.White
\tlblAppTitle.TextSize = 20 * sc
\tlblAppTitle.Gravity = Gravity.CENTER_VERTICAL
\tTry
\t\tlblAppTitle.Typeface = Typeface.LoadFromAssets("xenara-bold.ttf")
\tCatch
\t\tlblAppTitle.Typeface = Typeface.DEFAULT_BOLD
\tEnd Try
\tpnlTopBar.AddView(lblAppTitle, 4%x + 44dip * sc, 7dip * sc, 55%x, 42dip * sc)
\t
\t' 3. 3-dot Menu on Far Right
\tDim pnlMenuBtn As Panel
\tpnlMenuBtn.Initialize("btnMenu")
\tpnlMenuBtn.Color = Colors.Transparent
\tpnlTopBar.AddView(pnlMenuBtn, 100%x - 45dip * sc, 0, 45dip * sc, 52dip * sc)
\t
\tDim imgMenu As ImageView
\tDim bmpMenu As Bitmap
\tbmpMenu.Initialize(File.DirAssets, "android-3-dot-menu.png")
\timgMenu.Initialize("btnMenu")
\timgMenu.Bitmap = bmpMenu
\timgMenu.Gravity = Gravity.FILL
\tpnlMenuBtn.AddView(imgMenu, (pnlMenuBtn.Width - 22dip * sc) / 2, 14dip * sc, 22dip * sc, 22dip * sc)
\t
\t' 4. Active Preset Sub-Header Label
\tlblRotorNameHeader.Initialize("")
\tlblRotorNameHeader.Text = ActiveGeom.Name
\tlblRotorNameHeader.TextColor = ColorAccentCyan
\tlblRotorNameHeader.TextSize = 10 * sc
\tlblRotorNameHeader.Gravity = Gravity.CENTER_VERTICAL + Gravity.RIGHT
\tpnlTopBar.AddView(lblRotorNameHeader, 100%x - 180dip * sc, 10dip * sc, 130dip * sc, 34dip * sc)
\t
\t' 5. Three Tabs directly inside pnlTopBar!
\tDim tabY As Int = 57dip * sc
\tDim tabH As Int = 45dip * sc
\tDim tabW As Int = 100%x / 3
\t
\tbtnTabGeom.Initialize("btnTabGeom")
\tbtnTabGeom.Text = "GEOMETRY"
\tbtnTabGeom.TextColor = ColorAccentCyan
\tbtnTabGeom.TextSize = 12 * sc
\tbtnTabGeom.Typeface = Typeface.DEFAULT_BOLD
\tbtnTabGeom.Color = Colors.Transparent
\tbtnTabGeom.Gravity = Gravity.CENTER
\tpnlTopBar.AddView(btnTabGeom, 0, tabY, tabW, tabH)
\t
\tbtnTabCond.Initialize("btnTabCond")
\tbtnTabCond.Text = "CONDITIONS"
\tbtnTabCond.TextColor = ColorTextDim
\tbtnTabCond.TextSize = 12 * sc
\tbtnTabCond.Typeface = Typeface.DEFAULT_BOLD
\tbtnTabCond.Color = Colors.Transparent
\tbtnTabCond.Gravity = Gravity.CENTER
\tpnlTopBar.AddView(btnTabCond, tabW, tabY, tabW, tabH)
\t
\tbtnTabRes.Initialize("btnTabRes")
\tbtnTabRes.Text = "RESULTS"
\tbtnTabRes.TextColor = ColorTextDim
\tbtnTabRes.TextSize = 12 * sc
\tbtnTabRes.Typeface = Typeface.DEFAULT_BOLD
\tbtnTabRes.Color = Colors.Transparent
\tbtnTabRes.Gravity = Gravity.CENTER
\tpnlTopBar.AddView(btnTabRes, tabW * 2, tabY, 100%x - tabW * 2, tabH)
\t
\t' 6. Hairline divider between title and pager
\tDim line2 As Panel
\tline2.Initialize("")
\tline2.Color = 0xFF1E2738
\tpnlTopBar.AddView(line2, 0, (102dip - 1dip) * sc, 100%x, 1dip * sc)
\t
\t' 7. Sliding Cyan Indicator Line
\tpnlTabIndicator.Initialize("")
\tpnlTabIndicator.Color = ColorAccentCyan
\tpnlTopBar.AddView(pnlTabIndicator, 0, (101dip - 4dip) * sc, tabW, 4dip * sc)
End Sub

' Builds the AHViewPager containing all 3 swipeable pages
Private Sub BuildViewPager(headerH As Int, pagerHeight As Int)
\tcontainer.Initialize
\t
\t' 1. Page Geometry
\tpnlPageGeom.Initialize("")
\tpnlPageGeom.Color = ColorBg
\tBuildPageGeom(pnlPageGeom, pagerHeight)
\tcontainer.AddPage(pnlPageGeom, "Geometry")
\t
\t' 2. Page Conditions
\tpnlPageCond.Initialize("")
\tpnlPageCond.Color = ColorBg
\tBuildPageCond(pnlPageCond, pagerHeight)
\tcontainer.AddPage(pnlPageCond, "Conditions")
\t
\t' 3. Page Results
\tpnlPageRes.Initialize("")
\tpnlPageRes.Color = ColorBg
\tBuildPageRes(pnlPageRes, pagerHeight)
\tcontainer.AddPage(pnlPageRes, "Results")
\t
\tpager.Initialize2(container, "pager")
\tActivity.AddView(pager, 0, headerH, 100%x, pagerHeight)
End Sub

' Page 0: Geometry Layout
Private Sub BuildPageGeom(parent As Panel, pageHeight As Int)"""

    code = old_setup_pattern.sub(new_setup, code)

    # 3. Update BuildPageGeom signature and scrollview add
    code = code.replace(
        "parent.AddView(scvGeom, 0, 0, root.Width, parent.Height)",
        "parent.AddView(scvGeom, 0, 0, 100%x, pageHeight)"
    )

    # 4. Update BuildPageCond signature and scrollview add
    code = code.replace(
        "Private Sub BuildPageCond(parent As Panel)\n\tscvCond.Initialize(1000dip)\n\tparent.AddView(scvCond, 0, 0, root.Width, parent.Height)",
        "Private Sub BuildPageCond(parent As Panel, pageHeight As Int)\n\tscvCond.Initialize(1000dip)\n\tparent.AddView(scvCond, 0, 0, 100%x, pageHeight)"
    )

    # 5. Update BuildPageRes signature and scrollview add
    code = code.replace(
        "Private Sub BuildPageRes(parent As Panel)\n\tscvRes.Initialize(1000dip)\n\tparent.AddView(scvRes, 0, 0, root.Width, parent.Height)",
        "Private Sub BuildPageRes(parent As Panel, pageHeight As Int)\n\tscvRes.Initialize(1000dip)\n\tparent.AddView(scvRes, 0, 0, 100%x, pageHeight)"
    )

    # 6. Replace remaining root.Width with 100%x and root.Height with 100%y
    code = code.replace("root.Width", "100%x")
    code = code.replace("root.Height", "100%y")

    # 7. Update pager_PageChanged
    old_pager_changed = re.compile(
        r"Sub pager_PageChanged\(Position As Int\).*?End Sub\s*Sub btnTabGeom_Click",
        re.DOTALL
    )
    new_pager_changed = """Sub pager_PageChanged(Position As Int)
\tCurrentPage = Position
\tDim tabW As Int = 100%x / 3
\tpnlTabIndicator.SetLayoutAnimated(150, Position * tabW, (101dip - 4dip) * sc, tabW, 4dip * sc)
\t
\tbtnTabGeom.TextColor = ColorTextDim
\tbtnTabCond.TextColor = ColorTextDim
\tbtnTabRes.TextColor = ColorTextDim
\t
\tIf Position = 0 Then
\t\tbtnTabGeom.TextColor = ColorAccentCyan
\tElse If Position = 1 Then
\t\tbtnTabCond.TextColor = ColorAccentCyan
\tElse
\t\tbtnTabRes.TextColor = ColorAccentCyan
\t\tRecalculateRotor
\tEnd If
End Sub

Sub btnTabGeom_Click"""
    code = old_pager_changed.sub(new_pager_changed, code)

    # 8. In btnViewPolarPlot_Click, add pnlSweepPopup to Activity
    code = code.replace(
        'root.AddView(pnlSweepPopup, 0, 0, 100%x, 100%y)',
        'Activity.AddView(pnlSweepPopup, 0, 0, 100%x, 100%y)\n\tpnlSweepPopup.BringToFront'
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

    print("Refactoring completed successfully on RotorCalculator.b4a!")

if __name__ == "__main__":
    refactor_b4a()
