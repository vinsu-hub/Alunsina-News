"""Scheduled ingest trigger for ALUNSINA NEWS.

Modal doesn't run the pipeline itself. It calls the deployed Next.js app's
`POST /api/ingest` on a schedule, so the database stays with the app.

Setup (once):
    modal secret create alunsina-ingest \
        INGEST_URL=https://<your-app-host>/api/ingest \
        INGEST_TOKEN=<same value as the app's INGEST_TOKEN>

Deploy (activates the schedule):   modal deploy cron/ingest_cron.py
Trigger once manually:             modal run cron/ingest_cron.py
"""

import json
import os
import urllib.error
import urllib.request

import modal

app = modal.App("alunsina-ingest-cron")

# Stdlib-only; the default image is enough.
image = modal.Image.debian_slim(python_version="3.12")


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("alunsina-ingest")],
    schedule=modal.Cron("*/30 * * * *"),  # every 30 minutes, UTC
    timeout=600,
    retries=modal.Retries(max_retries=2, backoff_coefficient=2.0, initial_delay=30.0),
)
def trigger_ingest() -> dict:
    url = os.environ["INGEST_URL"]
    req = urllib.request.Request(
        url,
        method="POST",
        headers={
            "Authorization": f"Bearer {os.environ['INGEST_TOKEN']}",
            "Content-Type": "application/json",
            "User-Agent": "alunsina-ingest-cron/1.0",
        },
        data=b"{}",
    )
    try:
        # Ingest fetches ~30 feeds and re-clusters; allow up to 9 minutes.
        with urllib.request.urlopen(req, timeout=540) as resp:
            body = resp.read().decode("utf-8", "replace")
            status = resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        # 401 means a token mismatch; retrying won't help, so fail loudly without retrying forever.
        raise RuntimeError(f"Ingest endpoint returned {e.code}: {body}") from e

    try:
        result = json.loads(body)
    except json.JSONDecodeError:
        result = {"raw": body[:500]}
    print(f"ingest {status}: {json.dumps(result)[:1000]}")
    return result


@app.local_entrypoint()
def main():
    print(trigger_ingest.remote())
