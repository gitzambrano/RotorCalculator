# RotorCalculator Play release materials

The publication script is adapted from AeroCalculator's `tools/upload_playstore.py` and uses the official Android Publisher v3 API. It defaults to a draft and validation only.

## Assets

- `icon.png`: the application's actual 512 × 512 icon.
- `feature-graphic.png`: opaque 1024 × 500 graphic, reproducible with `python tools/generate_store_feature.py`.
- `listing-en-US.json`: title and descriptions matching the Android app.
- `phone-screenshots/`: actual Android captures, not web mockups.
- `tablet-screenshots/`: actual Android tablet captures.
- Release notes: `docs/release_notes_1.21.txt`.

Public privacy policy: https://gist.github.com/gitzambrano/d7a25b22e7132295bd1386b3cea4b0fe

The same policy is available offline from the app's global menu. Public support contact is `flightdyn@gmail.com`, matching Flight Dyn's existing store contact.

## Local release gates

Run the offline verifier, pytest, the compiled-engine verifier, a real B4A build, and the complete Android UI/functional matrix. Open the real screenshots and inspect them before publication. Record the tested source revision and evidence in release documentation; Python reference tests alone are not a compiled-engine equivalence gate.

Signing and API credentials remain outside Git. Supply the keystore through `B4A_KEY_FILE`, `B4A_KEY_PASSWORD`, and `B4A_KEY_ALIAS`, and the service account through `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.

Validate a prepared signed bundle and listing:

```powershell
python tools/upload_playstore.py --listing-dir store --contact-email flightdyn@gmail.com --validate-only
```

After all local gates and Console setup have passed, publishing requires the explicit `--no-validate-only` option and intended track/status. An API commit is a submission to Google Play; public availability must be verified in the Console after Google's review.

The Console still handles declarations, content rating, app signing setup, privacy URL, category, availability, and review status.
