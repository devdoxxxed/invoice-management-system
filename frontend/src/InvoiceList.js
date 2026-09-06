import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";

const emptyForm = {
    invoice_number: "",
    customer_name: "",
    issue_date: "",
    due_date: "",
    status: "pending",
    line_items: [{ description: "", quantity: 1, unit_price: 0 }],
};

function InvoiceList({ role }) {
    const [invoices, setInvoices] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [sortField, setSortField] = useState("issue_date");
    const [sortDirection, setSortDirection] = useState("desc");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);

    const isAdmin = role === "admin";

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/invoices", {
                params: {
                    page,
                    limit,
                    sort_by: sortField,
                    order: sortDirection,
                    search: search || undefined,
                    status: statusFilter || undefined,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                },
            });
            setInvoices(res.data.items);
            setTotal(res.data.total);
            setError("");
        } catch (err) {
            setError("Failed to fetch invoices");
        }
        setLoading(false);
    }, [page, limit, sortField, sortDirection, search, statusFilter, startDate, endDate]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(""), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === invoices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(invoices.map((i) => i.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} selected invoice(s)?`)) return;
        try {
            await api.post("/invoices/bulk-delete", { ids: selectedIds });
            setMessage("Selected invoices deleted");
            setSelectedIds([]);
            fetchInvoices();
        } catch {
            setError("Bulk delete failed");
        }
    };

    const handleExportCSV = async () => {
        const res = await api.get("/invoices/export", { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "invoices.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this invoice?")) return;
        try {
            await api.delete(`/invoices/${id}`);
            setMessage("Invoice deleted");
            fetchInvoices();
        } catch {
            setError("Delete failed");
        }
    };

    const handleLineItemChange = (idx, field, value) => {
        const items = [...form.line_items];
        items[idx] = { ...items[idx], [field]: value };
        setForm({ ...form, line_items: items });
    };

    const addLineItem = () => {
        setForm({
            ...form,
            line_items: [...form.line_items, { description: "", quantity: 1, unit_price: 0 }],
        });
    };

    const removeLineItem = (idx) => {
        setForm({ ...form, line_items: form.line_items.filter((_, i) => i !== idx) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/invoices", {
                ...form,
                line_items: form.line_items.map((li) => ({
                    description: li.description,
                    quantity: Number(li.quantity),
                    unit_price: Number(li.unit_price),
                })),
            });
            setMessage("Invoice created");
            setForm(emptyForm);
            setShowForm(false);
            fetchInvoices();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to create invoice");
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div>
            <div className="stats">
                <div className="chip">Total: {total}</div>
                <div className="search">
                    <input
                        type="text"
                        placeholder="Search invoice # or customer..."
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setPage(1);
                        setStatusFilter(e.target.value);
                    }}
                >
                    <option value="">All statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                </select>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                        setPage(1);
                        setStartDate(e.target.value);
                    }}
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                        setPage(1);
                        setEndDate(e.target.value);
                    }}
                />
                <button className="btn btn-light" onClick={handleExportCSV}>
                    Export CSV
                </button>
                {isAdmin && (
                    <button className="btn" onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Cancel" : "New Invoice"}
                    </button>
                )}
            </div>

            {message && <div className="success-msg">{message}</div>}
            {error && <div className="error-msg">{error}</div>}

            {showForm && isAdmin && (
                <div className="card form-card">
                    <h2>New Invoice</h2>
                    <form onSubmit={handleSubmit} className="product-form">
                        <input
                            type="text"
                            placeholder="Invoice Number"
                            value={form.invoice_number}
                            onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Customer Name"
                            value={form.customer_name}
                            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            value={form.issue_date}
                            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            value={form.due_date}
                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                            required
                        />
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                        </select>

                        <div className="line-items-editor">
                            <h3>Line Items</h3>
                            {form.line_items.map((li, idx) => (
                                <div className="line-item-row" key={idx}>
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={li.description}
                                        onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={li.quantity}
                                        onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Unit Price"
                                        value={li.unit_price}
                                        onChange={(e) => handleLineItemChange(idx, "unit_price", e.target.value)}
                                        required
                                    />
                                    {form.line_items.length > 1 && (
                                        <button type="button" className="btn btn-delete" onClick={() => removeLineItem(idx)}>
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="btn btn-light" onClick={addLineItem}>
                                + Add Line Item
                            </button>
                        </div>

                        <div className="form-actions">
                            <button className="btn" type="submit">
                                Create Invoice
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card list-card">
                <div className="list-header-row">
                    <h2>Invoices</h2>
                    {isAdmin && selectedIds.length > 0 && (
                        <button className="btn btn-delete" onClick={handleBulkDelete}>
                            Delete Selected ({selectedIds.length})
                        </button>
                    )}
                </div>
                {loading ? (
                    <div className="loader">Loading...</div>
                ) : (
                    <div className="scroll-x">
                        <table className="product-table">
                            <thead>
                                <tr>
                                    {isAdmin && (
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={invoices.length > 0 && selectedIds.length === invoices.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th
                                        className={`sortable ${sortField === "invoice_number" ? `sort-${sortDirection}` : ""}`}
                                        onClick={() => handleSort("invoice_number")}
                                    >
                                        Invoice #
                                    </th>
                                    <th
                                        className={`sortable ${sortField === "customer_name" ? `sort-${sortDirection}` : ""}`}
                                        onClick={() => handleSort("customer_name")}
                                    >
                                        Customer
                                    </th>
                                    <th
                                        className={`sortable ${sortField === "issue_date" ? `sort-${sortDirection}` : ""}`}
                                        onClick={() => handleSort("issue_date")}
                                    >
                                        Issue Date
                                    </th>
                                    <th
                                        className={`sortable ${sortField === "due_date" ? `sort-${sortDirection}` : ""}`}
                                        onClick={() => handleSort("due_date")}
                                    >
                                        Due Date
                                    </th>
                                    <th>Status</th>
                                    <th
                                        className={`sortable ${sortField === "total_amount" ? `sort-${sortDirection}` : ""}`}
                                        onClick={() => handleSort("total_amount")}
                                    >
                                        Amount
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        {isAdmin && (
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(inv.id)}
                                                    onChange={() => toggleSelect(inv.id)}
                                                />
                                            </td>
                                        )}
                                        <td>
                                            <Link to={`/invoices/${inv.id}`}>{inv.invoice_number}</Link>
                                        </td> 
                                        <td>{inv.customer_name}</td>
                                        <td>{inv.issue_date}</td>
                                        <td>{inv.due_date}</td>
                                        <td>
                                            <span className={`status-badge status-${inv.status}`}>{inv.status}</span>
                                        </td>
                                        <td><span className="amount">${inv.total_amount.toFixed(2)}</span></td>
                                        <td>
                                            <div className="row-actions">
                                                <Link className="btn btn-light" to={`/invoices/${inv.id}`}>
                                                    View
                                                </Link>
                                                {isAdmin && (
                                                    <button className="btn btn-delete" onClick={() => handleDelete(inv.id)}>
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 8 : 7}>
    <div className="empty-state">
      <div className="empty-state-title">
        {search || statusFilter || startDate ? "Nothing matches those filters" : "No invoices yet"}
      </div>
      <div className="empty-state-sub">
        {search || statusFilter || startDate
          ? "Try widening your search or clearing a filter."
          : "Once you create one, it'll show up here."}
      </div>
    </div>
  </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="pagination">
                    <button
                        className="btn btn-light"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Prev
                    </button>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="btn btn-light"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InvoiceList;