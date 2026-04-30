from fastapi import APIRouter
from app.services.intelligence import (
    get_route_options, detect_anomalies,
    get_tolls_on_route, get_weather_for_route,
    get_fuel_prices, get_simulated_news
)
from app.services.shipment_service import get_connection
from pydantic import BaseModel

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    vehicle_type: str = "truck"
    diesel_price: float = 92.5

@router.post("/routes")
async def get_routes(req: RouteRequest):
    return get_route_options(
        req.origin_lat, req.origin_lon,
        req.dest_lat, req.dest_lon,
        req.vehicle_type, req.diesel_price
    )

@router.get("/anomalies/{tracking_number}")
async def get_anomalies(tracking_number: str):
    conn = get_connection()
    try:
        rows = conn.run("SELECT id::text FROM shipments WHERE tracking_number = :tn", tn=tracking_number)
        if not rows:
            return {"anomalies": [], "theft_risk": "LOW", "accident_probability": "5%", "driver_behavior_score": 90}
        shipment_id = rows[0][0]
        gps_rows = conn.run("""
            SELECT latitude, longitude, speed_kmh
            FROM gps_updates WHERE shipment_id = :sid::uuid
            ORDER BY timestamp DESC LIMIT 10
        """, sid=shipment_id)
        gps_history = [{"latitude": r[0], "longitude": r[1], "speed_kmh": r[2] or 65} for r in gps_rows]
        return detect_anomalies(tracking_number, gps_history)
    finally:
        conn.close()

@router.get("/weather")
async def get_weather(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float):
    return await get_weather_for_route(origin_lat, origin_lon, dest_lat, dest_lon)

@router.get("/fuel-prices")
async def get_fuel():
    return await get_fuel_prices()

@router.get("/news")
async def get_news():
    return get_simulated_news()

@router.get("/tolls")
async def get_tolls(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float):
    return get_tolls_on_route(origin_lat, origin_lon, dest_lat, dest_lon)