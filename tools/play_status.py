"""Read-only Google Play status: lists uploaded bundle version codes and track releases.

Opens a temporary edit, reads it and deletes it, so nothing is published.
Run: python tools/play_status.py
"""
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

PACKAGE = "flightdyn.rotorcalculator"
KEY = Path(__file__).resolve().parent.parent / "Key" / "play_store_service_account.json"

creds = service_account.Credentials.from_service_account_file(
    str(KEY), scopes=["https://www.googleapis.com/auth/androidpublisher"]
)
api = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
edit = api.edits().insert(packageName=PACKAGE, body={}).execute()
try:
    bundles = api.edits().bundles().list(packageName=PACKAGE, editId=edit["id"]).execute().get("bundles", [])
    print("bundles:", [b["versionCode"] for b in bundles])
    tracks = api.edits().tracks().list(packageName=PACKAGE, editId=edit["id"]).execute().get("tracks", [])
    for track in tracks:
        for rel in track.get("releases", []):
            print(f'{track["track"]}: {rel.get("name")} {rel.get("versionCodes")} {rel.get("status")}')
finally:
    api.edits().delete(packageName=PACKAGE, editId=edit["id"]).execute()
