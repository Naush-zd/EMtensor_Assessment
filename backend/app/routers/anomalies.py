from fastapi import APIRouter, Depends
from ..loader import ProjectData, get_data
from ..anomalies import detect_all, Anomaly

router = APIRouter()


@router.get("/anomalies")
def get_anomalies(data: ProjectData = Depends(get_data)) -> list[dict]:
    anomalies = detect_all(data)
    return [
        {
            "rule_id": a.rule_id,
            "severity": a.severity,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "message": a.message,
            "detail": a.detail,
        }
        for a in anomalies
    ]
