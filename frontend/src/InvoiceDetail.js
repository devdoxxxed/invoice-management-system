import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "./api";

function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch(() => setError("Invoice not found"));
  }, [id]);

  if (error) return <div className="error-msg">{error}</div>;
  if (!invoice) return <div className="loader">Loading...</div>;

  return (
    <div className="card">
      <Link to="/invoices">&larr; Back to invoices</Link>
      <div className="invoice-header-row no-print">
        <h2>{invoice.invoice_number}</h2>
        <button className="btn" onClick={() => window.print()}>
          Download Invoice
        </button>
      </div>

      <div className="invoice-summary">
        <div><strong>Customer:</strong> {invoice.customer_name}</div>
        <div><strong>Issue Date:</strong> {invoice.issue_date}</div>
        <div><strong>Due Date:</strong> {invoice.due_date}</div>
        <div>
          <strong>Status:</strong>{" "}
          <span className={`status-badge status-${invoice.status}`}>{invoice.status}</span>
        </div>
<div><strong>Total:</strong> <span className="amount">${invoice.total_amount.toFixed(2)}</span></div>      </div>

      <h3>Line Items</h3>
      <table className="product-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.line_items.map((li) => (
            <tr key={li.id}>
              <td>{li.description}</td>
              <td>{li.quantity}</td>
              <td><span className="amount">${li.unit_price.toFixed(2)}</span></td>
<td><span className="amount">${(li.quantity * li.unit_price).toFixed(2)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvoiceDetail;