from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.services.shipment_service import (
    create_shipment,
    get_all_shipments,
    get_shipment_by_tracking
)

router = APIRouter(prefix="/api/shipments", tags=["shipments"])

class ShipmentCreate(BaseModel):
    tracking_number: str
    origin_city: str
    origin_lat: float
    origin_lon: float
    destination_city: str
    destination_lat: float
    destination_lon: float
    scheduled_departure: datetime
    scheduled_arrival: datetime
    carrier_name: Optional[str] = None
    vehicle_type: Optional[str] = None
    cargo_weight_kg: Optional[float] = None
    cargo_value_usd: Optional[float] = None

@router.get("/")
async def get_shipments():
    shipments = await get_all_shipments()
    return {
        "total": len(shipments),
        "shipments": shipments
    }

@router.post("/")
async def create_new_shipment(shipment: ShipmentCreate):
    try:
        result = await create_shipment(shipment.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{tracking_number}")
async def get_shipment(tracking_number: str):
    shipment = await get_shipment_by_tracking(tracking_number)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment