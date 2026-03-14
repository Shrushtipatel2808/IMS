# 📦 Inventory Management System (IMS)

A full-stack Inventory Management System built for hackathon demos.

## Tech Stack

### Frontend
- **React** with **Vite** for fast development
- **TailwindCSS** for utility-first styling
- **Framer Motion** for smooth animations
- **React Router** for client-side routing
- **Axios** for API communication

### Backend
- **Node.js** + **Express** REST API
- **MongoDB Atlas** with Mongoose ODM
- **JWT** authentication
- **bcryptjs** for password hashing

## Project Structure

```
IMS/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (Auth)
│   │   ├── pages/          # Page components
│   │   └── services/       # API service layer
│   └── vite.config.js
├── server/                 # Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── index.js            # Server entry point
└── README.md
```

## Models

- **User** — Authentication with roles (admin, manager, staff)
- **Product** — Inventory items with SKU, pricing, stock levels
- **Warehouse** — Storage locations with capacity tracking
- **StockMovement** — Audit trail for stock in/out/transfer

## API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and get JWT token
- `GET /api/auth/me` — Get current user profile

### Products (Protected)
- `GET /api/products` — List all products
- `GET /api/products/:id` — Get a product
- `POST /api/products` — Create a product
- `PUT /api/products/:id` — Update a product
- `DELETE /api/products/:id` — Delete a product

### Warehouses (Protected)
- `GET /api/warehouses` — List all warehouses
- `GET /api/warehouses/:id` — Get a warehouse
- `POST /api/warehouses` — Create a warehouse
- `PUT /api/warehouses/:id` — Update a warehouse
- `DELETE /api/warehouses/:id` — Delete a warehouse

### Stock Movements (Protected)
- `GET /api/stock-movements` — List all movements
- `GET /api/stock-movements/:id` — Get a movement
- `POST /api/stock-movements` — Record a movement

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend dev server proxies API requests to `http://localhost:5000`.

## Environment Variables

Create a `.env` file in the `server/` directory:

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ims
JWT_SECRET=your_secret_key
```
