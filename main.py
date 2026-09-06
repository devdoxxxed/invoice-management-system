import csv
import io
from datetime import date
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc

from database import SessionLocal, engine
from database_model import Base, InvoiceDB, LineItemDB
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Invoice Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def compute_status(inv: InvoiceDB) -> str:
    # Overdue is derived, not stored: pending + past due date.
    if inv.status == "paid":
        return "paid"
    if inv.due_date < date.today():
        return "overdue"
    return "pending"


@app.get("/invoices", response_model=models.PaginatedInvoices)
def list_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = Query("issue_date"),
    order: str = Query("desc"),
    search: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(InvoiceDB)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(InvoiceDB.invoice_number.ilike(like), InvoiceDB.customer_name.ilike(like))
        )
    if start_date:
        query = query.filter(InvoiceDB.issue_date >= start_date)
    if end_date:
        query = query.filter(InvoiceDB.issue_date <= end_date)

    total = query.count()

    sort_column = getattr(InvoiceDB, sort_by, InvoiceDB.issue_date)
    query = query.order_by(asc(sort_column) if order == "asc" else desc(sort_column))

    items = query.offset((page - 1) * limit).limit(limit).all()

    # status filter applied after computing derived overdue status
    results = [i for i in items if not status or compute_status(i) == status]
    for i in results:
        i.status = compute_status(i)

    return {"total": total, "page": page, "limit": limit, "items": results}


@app.get("/invoices/summary", response_model=models.DashboardSummary)
def summary(db: Session = Depends(get_db)):
    all_invoices = db.query(InvoiceDB).all()
    total = len(all_invoices)
    paid = sum(1 for i in all_invoices if i.status == "paid")
    overdue = sum(1 for i in all_invoices if compute_status(i) == "overdue")
    pending_amount = sum(
        i.total_amount for i in all_invoices if compute_status(i) in ("pending", "overdue")
    )
    return {
        "total_invoices": total,
        "paid_invoices": paid,
        "pending_amount": pending_amount,
        "overdue_invoices": overdue,
    }


@app.get("/invoices/export")
def export_csv(db: Session = Depends(get_db)):
    invoices = db.query(InvoiceDB).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Invoice Number", "Customer", "Issue Date", "Due Date", "Status", "Total"])
    for i in invoices:
        writer.writerow(
            [i.invoice_number, i.customer_name, i.issue_date, i.due_date, compute_status(i), i.total_amount]
        )
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices.csv"},
    )


@app.post("/invoices/bulk-delete")
def bulk_delete(payload: models.BulkDeleteRequest, db: Session = Depends(get_db)):
    db.query(InvoiceDB).filter(InvoiceDB.id.in_(payload.ids)).delete(synchronize_session=False)
    db.commit()
    return {"deleted": payload.ids}


@app.get("/invoices/{invoice_id}", response_model=models.Invoice)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(InvoiceDB).filter(InvoiceDB.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = compute_status(inv)
    return inv


@app.post("/invoices", response_model=models.Invoice)
def create_invoice(invoice: models.InvoiceCreate, db: Session = Depends(get_db)):
    total = sum(li.quantity * li.unit_price for li in invoice.line_items)
    db_invoice = InvoiceDB(
        invoice_number=invoice.invoice_number,
        customer_name=invoice.customer_name,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        status=invoice.status,
        total_amount=total,
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    for li in invoice.line_items:
        db.add(LineItemDB(invoice_id=db_invoice.id, **li.dict()))
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@app.put("/invoices/{invoice_id}", response_model=models.Invoice)
def update_invoice(invoice_id: int, invoice: models.InvoiceBase, db: Session = Depends(get_db)):
    db_invoice = db.query(InvoiceDB).filter(InvoiceDB.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in invoice.dict().items():
        setattr(db_invoice, field, value)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@app.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    db_invoice = db.query(InvoiceDB).filter(InvoiceDB.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(db_invoice)
    db.commit()
    return {"deleted": invoice_id}