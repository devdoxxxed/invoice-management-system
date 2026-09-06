from pydantic import BaseModel
from datetime import date
from typing import List, Optional


class LineItemBase(BaseModel):
    description: str
    quantity: int
    unit_price: float


class LineItemCreate(LineItemBase):
    pass


class LineItem(LineItemBase):
    id: int

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    invoice_number: str
    customer_name: str
    issue_date: date
    due_date: date
    status: str = "pending"


class InvoiceCreate(InvoiceBase):
    line_items: List[LineItemCreate]


class Invoice(InvoiceBase):
    id: int
    total_amount: float
    line_items: List[LineItem] = []

    class Config:
        from_attributes = True


class InvoiceListItem(BaseModel):
    id: int
    invoice_number: str
    customer_name: str
    issue_date: date
    due_date: date
    status: str
    total_amount: float

    class Config:
        from_attributes = True


class PaginatedInvoices(BaseModel):
    total: int
    page: int
    limit: int
    items: List[InvoiceListItem]


class DashboardSummary(BaseModel):
    total_invoices: int
    paid_invoices: int
    pending_amount: float
    overdue_invoices: int


class BulkDeleteRequest(BaseModel):
    ids: List[int]