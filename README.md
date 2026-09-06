# Invoice Management System

A frontend-focused invoice management application built with React, backed by a FastAPI + SQLAlchemy + PostgreSQL API. Built as a submission for the FreightFox frontend assignment.

## Features

- **Dashboard** — total invoices, paid invoices, pending amount, and overdue invoice counts at a glance
- **Invoice Listing** — server-side pagination, column sorting, search by invoice number/customer, and filters by status and issue date range
- **Invoice Details** — line-item breakdown with computed totals, and a downloadable invoice view
- **Bulk Actions** — multi-select invoices for batch deletion
- **CSV Export** — download the full invoice list as a CSV
- **Role-Based View** — toggle between Admin and Viewer to show/hide create, edit, and delete actions
- **Light/Dark Theme**

## Tech Stack

- **Frontend:** React, React Router, Axios
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL

## API Endpoints

| Method | Endpoint                  | Description                                  |
|--------|---------------------------|-----------------------------------------------|
| GET    | `/invoices`                | List invoices — supports pagination, sort, search, status/date filters |
| GET    | `/invoices/{id}`           | Get a single invoice with its line items      |
| POST   | `/invoices`                 | Create an invoice with nested line items      |
| PUT    | `/invoices/{id}`            | Update an invoice                             |
| DELETE | `/invoices/{id}`            | Delete an invoice                             |
| POST   | `/invoices/bulk-delete`     | Delete multiple invoices by ID                |
| GET    | `/invoices/summary`         | Dashboard stats (totals, paid, pending, overdue) |
| GET    | `/invoices/export`          | Download all invoices as CSV                  |

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js and npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/devdoxxxed/invoice-management-system.git
cd invoice-management-system
```

### 2. Set up PostgreSQL

```bash
psql -U your_username -d postgres
```
```sql
CREATE DATABASE invoices;
```

### 3. Configure environment variables

Create a `.env` file in the project root (not committed to git):

DATABASE_URL=postgresql+psycopg://your_username:your_password@localhost:5432/invoices


### 4. Start the backend

```bash
python3 -m venv myenv
source myenv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at `http://127.0.0.1:8000` — interactive docs at `http://127.0.0.1:8000/docs`.

### 5. Start the frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

## Project Structure

invoice-management-system/
├── main.py
├── database.py
├── database_model.py
├── models.py
├── requirements.txt
├── frontend/
│ └── src/
│ ├── App.js
│ ├── Dashboard.js
│ ├── InvoiceList.js
│ ├── InvoiceDetail.js
│ └── api.js
└── README.md


## Assumptions & Design Decisions

- **Overdue status is derived, not stored.** An invoice is treated as overdue when its status is `pending` and its due date has passed, rather than persisting a separate "overdue" value — this keeps the status always accurate against the current date without needing a background job to update records.
- **"Download Invoice" uses the browser's native print-to-PDF** rather than a server-generated PDF file, to prioritize the core listing/filtering/detail requirements within the assignment's time constraints.
- **Role-based access is mocked client-side** via an Admin/Viewer toggle (no real authentication) — Viewer mode hides create, edit, delete, and bulk-select actions to demonstrate permission-based UI, while Admin mode shows the full action set.
- **Bulk actions currently support delete only** — no other batch operations were in scope for the time available.

## Notes

- Ensure PostgreSQL is running before starting the backend.
- Never commit your `.env` file — only share `.env.example` with placeholder values if collaborating.