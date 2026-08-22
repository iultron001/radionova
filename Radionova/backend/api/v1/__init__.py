"""
RadiNova AI — API v1 Router Aggregator
"""

from fastapi import APIRouter
from backend.api.v1 import auth, studies, analysis, reports, patient

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth.router)
api_v1_router.include_router(studies.router)
api_v1_router.include_router(analysis.router)
api_v1_router.include_router(reports.router)
api_v1_router.include_router(patient.router)
