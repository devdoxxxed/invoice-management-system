from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class InvoiceDB(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    customer_name = Column(String, index=True)
    issue_date = Column(Date)
    due_date = Column(Date)
    status = Column(String, default="pending")  # "paid" | "pending" | "overdue"
    total_amount = Column(Float, default=0.0)

    line_items = relationship(
        "LineItemDB", back_populates="invoice", cascade="all, delete-orphan"
    )


class LineItemDB(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)

    invoice = relationship("InvoiceDB", back_populates="line_items")