from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.shipment_service import get_connection
import uuid

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])

class SupplierCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None

@router.get("/")
async def get_suppliers():
    conn = get_connection()
    try:
        rows = conn.run("""
            SELECT id::text, name, email, phone, country, city,
                   compliance_score, risk_level, total_shipments,
                   delayed_shipments, is_active, created_at
            FROM suppliers ORDER BY compliance_score ASC
        """)
        columns = [col['name'] for col in conn.columns]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()

@router.post("/")
async def create_supplier(supplier: SupplierCreate):
    conn = get_connection()
    try:
        result = conn.run("""
            INSERT INTO suppliers (id, name, email, phone, country, city)
            VALUES (:id::uuid, :name, :email, :phone, :country, :city)
            RETURNING id::text, name, email, compliance_score, risk_level
        """,
            id=str(uuid.uuid4()),
            name=supplier.name,
            email=supplier.email,
            phone=supplier.phone,
            country=supplier.country,
            city=supplier.city
        )
        columns = [col['name'] for col in conn.columns]
        return dict(zip(columns, result[0]))
    finally:
        conn.close()

@router.get("/stats")
async def get_supplier_stats():
    conn = get_connection()
    try:
        rows = conn.run("""
            SELECT 
                COUNT(*) as total,
                AVG(compliance_score) as avg_compliance,
                COUNT(CASE WHEN risk_level = 'high' OR risk_level = 'critical' THEN 1 END) as high_risk,
                COUNT(CASE WHEN compliance_score >= 90 THEN 1 END) as compliant
            FROM suppliers WHERE is_active = true
        """)
        columns = [col['name'] for col in conn.columns]
        return dict(zip(columns, rows[0]))
    finally:
        conn.close()