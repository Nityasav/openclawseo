"""
SEOClaw Agent Service — FastAPI entrypoint
Runs the LangGraph-based SEO/GEO intelligence agents
"""

import os
import asyncio
import logging
from datetime import datetime
from typing import Optional

import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, UUID4
from dotenv import load_dotenv

from graphs.orchestrator import OrchestratorGraph

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SEOClaw Agent Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory run tracking (use Redis in production)
active_runs: dict[str, dict] = {}


class RunRequest(BaseModel):
    run_id: str
    site_id: str
    run_type: str  # 'seo_audit' | 'geo_check' | 'report' | 'full'
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    gsc_data: Optional[list] = None
    ga4_data: Optional[list] = None


class RunStatus(BaseModel):
    run_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "ok", "service": "seoclaw-agent"}


@app.post("/run")
async def trigger_run(request: RunRequest, background_tasks: BackgroundTasks):
    """Trigger an agent run asynchronously."""
    if request.run_id in active_runs:
        return {"run_id": request.run_id, "status": "already_running"}

    active_runs[request.run_id] = {
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
    }

    background_tasks.add_task(execute_run, request)
    return {"run_id": request.run_id, "status": "started"}


@app.get("/status/{run_id}")
async def get_status(run_id: str) -> RunStatus:
    """Get the status of a run."""
    if run_id not in active_runs:
        raise HTTPException(status_code=404, detail="Run not found")

    run = active_runs[run_id]
    return RunStatus(
        run_id=run_id,
        status=run["status"],
        result=run.get("result"),
        error=run.get("error"),
        started_at=run.get("started_at"),
        completed_at=run.get("completed_at"),
    )


async def execute_run(request: RunRequest):
    """Execute the agent run in the background."""
    try:
        logger.info(f"Starting run {request.run_id} of type {request.run_type}")

        orchestrator = OrchestratorGraph(
            site_id=request.site_id,
            run_type=request.run_type,
            gsc_data=request.gsc_data or [],
            ga4_data=request.ga4_data or [],
        )

        result = await orchestrator.run()

        active_runs[request.run_id] = {
            **active_runs.get(request.run_id, {}),
            "status": "complete",
            "result": result,
            "completed_at": datetime.utcnow().isoformat(),
        }

        logger.info(f"Run {request.run_id} completed successfully")

        # Notify webhook
        if request.webhook_url:
            await notify_webhook(
                request.webhook_url,
                request.run_id,
                "complete",
                result,
                secret=request.webhook_secret,
            )

    except Exception as e:
        logger.error(f"Run {request.run_id} failed: {e}", exc_info=True)
        active_runs[request.run_id] = {
            **active_runs.get(request.run_id, {}),
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat(),
        }

        if request.webhook_url:
            await notify_webhook(
                request.webhook_url,
                request.run_id,
                "failed",
                error_message=str(e),
                secret=request.webhook_secret,
            )


async def notify_webhook(
    webhook_url: str,
    run_id: str,
    status: str,
    result: Optional[dict] = None,
    error_message: Optional[str] = None,
    secret: Optional[str] = None,
):
    """Notify the Next.js app of run completion."""
    payload = {
        "run_id": run_id,
        "status": status,
        "secret": secret or os.getenv("AGENT_WEBHOOK_SECRET", "seoclaw_webhook_secret_2026"),
    }
    if result:
        payload["result_json"] = result
    if error_message:
        payload["error_message"] = error_message

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(webhook_url, json=payload)
    except Exception as e:
        logger.error(f"Webhook notification failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
