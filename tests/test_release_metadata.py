"""Release metadata parity and Google Play preflight contract tests."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_web_and_android_versions_are_in_sync():
    b4a = (ROOT / "RotorCalculator.b4a").read_text(encoding="utf-8-sig")
    android_version = re.search(r"(?m)^\s*#VersionName:\s*(\S+)", b4a).group(1)
    android_code = int(re.search(r"(?m)^\s*#VersionCode:\s*(\d+)", b4a).group(1))
    pkg = json.loads((ROOT / "web/package.json").read_text(encoding="utf-8"))
    lock = json.loads((ROOT / "web/package-lock.json").read_text(encoding="utf-8"))
    assert pkg["version"] == android_version + ".0"
    assert lock["version"] == pkg["version"]
    assert lock["packages"][""]["version"] == pkg["version"]

    web_main = (ROOT / "web/src/main.ts").read_text(encoding="utf-8")
    assert f'<span class="version-badge">v{android_version}</span>' in web_main
    assert "Android App on Google Play" in web_main  # Avoid claiming an unshipped Play version.

    release_path = f"release-{android_version}.json"
    docs = json.loads((ROOT / "docs" / release_path).read_text(encoding="utf-8"))
    public = json.loads((ROOT / "web/public" / release_path).read_text(encoding="utf-8"))
    assert docs == public
    assert docs["version"] == android_version
    assert docs["versionCode"] == android_code
    assert docs["package"] == "flightdyn.rotorcalculator"
    assert docs["apkSha256"] is None  # Never invent a hash before a real Android build.
    assert docs["androidArtifactStatus"] == "pending-signed-build"


def test_google_play_release_notes_languages_and_lengths():
    b4a = (ROOT / "RotorCalculator.b4a").read_text(encoding="utf-8-sig")
    version = re.search(r"(?m)^\s*#VersionName:\s*(\S+)", b4a).group(1)
    notes = (ROOT / "docs" / f"release_notes_{version}.txt").read_text(encoding="utf-8")
    for locale in ("en-US", "pt-BR"):
        matches = re.findall(rf"<{locale}>\s*(.*?)\s*</{locale}>", notes, re.DOTALL)
        assert len(matches) == 1
        assert 10 < len(matches[0].strip()) <= 500
        assert version in matches[0]


def test_release_builder_is_fail_closed():
    helper = (ROOT / "tools/b4a_build.ps1").read_text(encoding="utf-8")
    prep = (ROOT / "tools/prepare_play_release_1_34.ps1").read_text(encoding="utf-8")
    assert 'throw "B4ABuilder.exe' in helper
    assert 'if (-not $KeyPassword)' in prep
    assert "Get-BuiltArtifact" in prep
    assert 'verify --verbose --print-certs $Apk' in prep
    assert "jarsigner.exe" in prep
    assert "Get-FileHash" in prep
    assert "playUpload = \"not-started\"" in prep
