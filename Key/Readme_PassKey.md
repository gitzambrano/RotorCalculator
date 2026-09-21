# 🔑 AeroCalculator - Keys & Play Store Release Guide

> **CONFIDENTIAL**: This document contains instructions and details regarding your private signing keys and credentials. It is excluded from Git commits via `.gitignore`.

---

## 📁 1. Inventory of Files in `Key/`

| File Name | Companion (Base64 Text) | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `key_aero_calc.keystore` | `key_aero_calc.keystore.b64.txt` | Binary / JKS Keystore | **Android Release Signing Keystore**. Required by B4A to sign APKs / AABs. |
| `keystore_name.pepk` | `keystore_name.pepk.b64.txt` | Binary / PEPK | **Google Play App Signing Key** encrypted payload for Google Play Console. |
| `pepk.jar` | `pepk.jar.b64.txt` | Binary / Java Tool | Tool from Google to export & encrypt private keys for Play App Signing. |
| `encryption_public_key.pem` | *(Text PEM)* | Text / Certificate | Google Play's public key used to encrypt the `.pepk` file. |
| `pepk_commandline.txt` | *(Plain Text)* | Text | Reference command and stored keystore password. |

### 🔐 Stored Credentials Reference
* **Keystore File**: `key_aero_calc.keystore`
* **Key Alias**: `b4a`
* **Keystore Password**: `81xadrez`

---

## 🔄 2. How to Revert Text (`.b64.txt`) Files Back to Binaries

If you ever lose the binary files (or download the text string from GitHub Secrets / a password manager), you can restore the exact binary files using PowerShell or Bash.

### Using Windows PowerShell:

```powershell
# Restore key_aero_calc.keystore
[IO.File]::WriteAllBytes("Key\key_aero_calc.keystore", [Convert]::FromBase64String((Get-Content -Raw "Key\key_aero_calc.keystore.b64.txt")))

# Restore keystore_name.pepk
[IO.File]::WriteAllBytes("Key\keystore_name.pepk", [Convert]::FromBase64String((Get-Content -Raw "Key\keystore_name.pepk.b64.txt")))

# Restore pepk.jar
[IO.File]::WriteAllBytes("Key\pepk.jar", [Convert]::FromBase64String((Get-Content -Raw "Key\pepk.jar.b64.txt")))
```

### Using Linux / macOS Terminal:

```bash
# Restore key_aero_calc.keystore
base64 -d Key/key_aero_calc.keystore.b64.txt > Key/key_aero_calc.keystore

# Restore keystore_name.pepk
base64 -d Key/keystore_name.pepk.b64.txt > Key/keystore_name.pepk

# Restore pepk.jar
base64 -d Key/pepk.jar.b64.txt > Key/pepk.jar
```

---

## 🔒 3. How to Save in GitHub Secrets (Vault)

To keep a backup in your private GitHub vault:
1. Open **[https://github.com/gitzambrano/AeroCalculator/settings/secrets/actions](https://github.com/gitzambrano/AeroCalculator/settings/secrets/actions)**
2. Click **New repository secret**.
3. Create the following secrets:
   * **`ANDROID_KEYSTORE_BASE64`**: Open `Key\key_aero_calc.keystore.b64.txt`, copy all contents, and paste.
   * **`KEYSTORE_PASSWORD`**: `81xadrez`
   * **`KEY_ALIAS`**: `b4a`

---

## 🚀 4. How to Update AeroCalculator on Google Play Store

Follow these steps every time you want to publish a new update/version to Google Play:

### Step 1: Increment Version in B4A
Open `AeroCalculator.b4a` in the B4A IDE and locate lines 68-69:
```basic
#Region Project Attributes
    #ApplicationLabel: AeroCalculator
    #VersionCode: 27      ' <-- MUST be incremented (e.g. 26 -> 27)
    #VersionName: 3.22    ' <-- User-facing version string (e.g. 3.21 -> 3.22)
    #SupportedOrientations: unspecified
    #CanInstallToExternalStorage: True
#End Region
```
> [!IMPORTANT]
> Google Play will reject any upload if `#VersionCode` is not strictly greater than the previous version.

---

### Step 2: Configure Private Sign Key in B4A
1. In the top menu of B4A, click: **Tools** > **Private Sign Key**.
2. **Key file**: Click browse and select `Key\key_aero_calc.keystore`.
3. **Password**: Enter `81xadrez`.
4. Click **OK**.

---

### Step 3: Build the Release Android App Bundle (.aab)
1. In the build configuration dropdown (top toolbar in B4A), select **Release** (or **Release (obfuscated)** if desired).
2. Click **Project** > **Build App Bundle** (or Compile to AAB).
3. B4A will generate the signed bundle file in your project:
   ```text
   Objects\AeroCalculator.aab
   ```

---

### Step 4: Upload to Google Play Console
1. Log in to [Google Play Console](https://play.google.com/console).
2. Select **AeroCalculator** (`flightdyn.aerocalculator`).
3. On the left menu, under **Release**, click **Production** (or **Internal testing** first if testing).
4. Click **Create new release** (top right).
5. In the **App bundles** section, upload `Objects\AeroCalculator.aab`.
6. Add your release notes (e.g., *"Bug fixes and performance improvements"*).
7. Click **Next** &rarr; **Save** &rarr; **Start rollout to Production**.

Google will review the release and publish it to the Play Store within a few hours!

---

## 🤖 5. Automated Upload via API (`tools/upload_playstore.py`)

You can upload the `.aab` file directly from the terminal without using the web browser:

### Step 1: Obtain a Service Account Key (One-time setup)
1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project linked to your Google Play account.
2. Go to **IAM & Admin** > **Service Accounts** and create a Service Account (e.g. `play-store-deployer`).
3. Click on the created Service Account > **Keys** > **Add Key** > **Create new key** (JSON).
4. Save the downloaded JSON file in the git-ignored folder:
   ```text
   Key\play_store_service_account.json
   ```
   *(This file is strictly excluded by `.gitignore` and must NEVER be committed to Git).*
5. In [Google Play Console](https://play.google.com/console), go to **Settings** > **API access**.
6. Grant your service account email the **Release Manager** (or **Admin**) role for `flightdyn.aerocalculator`.

### Step 2: Run the Upload Script
```powershell
# Upload to Internal Testing track (safest for testing):
python tools/upload_playstore.py --track internal

# Upload to Production track:
python tools/upload_playstore.py --track production

# Dry-run validation only (verifies credentials and bundle without publishing):
python tools/upload_playstore.py --validate-only
```
* The script automatically uses `Objects\AeroCalculator.aab` and reads multi-language release notes from `docs\release_notes_3.22.txt`.

