# Release visual review — RotorCalculator 1.30

The 1.30 visual release gate applies to a source-matched APK and the Web build generated from the same main commit. A green source or bounds test is necessary but does not replace visual inspection.

Required categories (0–5): alignment, typography, hierarchy, density, discoverability, consistency, responsive layout, Results readability, Geometry usability, Conditions usability, Sweep usability, Disk Contour usability, and overall polish.

Required profiles: 320×568 / 100%; 320×568 / 130%; 360×780; 393×873; 412×915; 600×960; 768×1024; 915×412; 1024×600. Inspect Dark and Light themes at minimum. Inspect Geometry top/derived/aerodynamics, Conditions top/bottom, Results top/middle/bottom, Parameter Sweep, and Disk Contour.

Disk Contour review shall verify the 14-variable selector, no clipped azimuth labels, disk/colorbar balance, two-significant-figure legend formatting, invalid-state presentation, single PNG export, and complete 14-file batch export. Android batch export shall use one destination-directory selection.

An objective, correctable defect below 4.8 is a rework item. Final scores and screenshot paths shall be recorded only after the source-matched runtime matrix completes. Production signing is a separate release-artifact gate and shall not be inferred from an ephemeral CI signing key.
