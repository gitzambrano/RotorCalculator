# RotorCalculator Google Play Release Materials

The automated publication script `tools/upload_playstore.py` interacts directly with the Google Play Developer Publishing API (Android Publisher v3). By default, the script validates bundle integrity and metadata in draft mode without committing changes.

---

## 1. Store Listing Assets

- `icon.png`: Official 512 × 512 Google Play and Android legacy launcher image. `web/public/icon.png` must be byte-identical. `Files/icon_header.png` supplies the transparent adaptive rotor emblem. `tools/prepare_launcher_icon.py` generates the B4A icon resource tree from these inputs.
- `feature-graphic.png`: Official 1024 × 500 feature graphic, generated via `python tools/generate_store_feature.py`.
- `listing-en-US.json`: Production title, short description, and full description matching application capabilities.
- `phone-screenshots/`: Real native Android device captures across standard phone form factors.
- `tablet-screenshots/`: Real native Android tablet captures (7-inch and 10-inch layouts).
- `docs/release_notes_<version>.txt`: User-facing release notes per release (en-US and pt-BR, 500 characters maximum per language).

Public Privacy Policy URL: https://gist.github.com/gitzambrano/d7a25b22e7132295bd1386b3cea4b0fe

The privacy policy is also bundled offline inside the application (`docs/privacy_policy.html`).
Official support contact email: `flightdyn@gmail.com`.

---

## 2. Local Release Verification Gates

Before publishing to the Google Play Store, execute the verification workflow:

1. Execute the physics engine verifier: `python tools/verify_engine.py`.
2. Execute the test suite: `pytest tests`.
3. Verify compiled engine parity: `python tools/verify_compiled_engine.py`.
4. Run `python tools/prepare_launcher_icon.py` followed by `python tools/verify_launcher_icon.py` (also enforced by the release script).
5. Compile the signed APK and App Bundle (`.aab`) targeting Android 16 (API 36), and verify the actual packaged launcher PNG pixels before upload.
6. Inspect screenshots of the application and the icon in the real Android launcher before upload.

---

## 3. Deployment Workflow

Signing credentials and service account JSON files remain outside version control. Pass credentials via environment variables:
- `B4A_KEY_FILE`: Path to `Key/rotorcalculator.keystore`.
- `B4A_KEY_PASSWORD`: Keystore and key password.
- `B4A_KEY_ALIAS`: Keystore key alias (`rotorcalculator`).
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: Path to Google Cloud service account JSON key.

### Validation Mode:
```powershell
python tools/upload_playstore.py --listing-dir store --contact-email flightdyn@gmail.com --validate-only
```

### Production Submission:
```powershell
python tools/upload_playstore.py --listing-dir store --contact-email flightdyn@gmail.com --status completed --no-validate-only
```
