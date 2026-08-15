# order_and_settlement_monorepo
Order and payment settlement application, Simple user-based application, create invoice, record payments, track payment timeline. Used monorepo for the code version control and deployed in vercel. 

# live URl (Deployed to Vercel)
[Live URL](https://order-and-settlement-app.vercel.app)


# Tech Stack
Nodejs 24.x (lts)
Nextjs 16.x (FE)
Expressjs (BE)
Shadcn/UI (Component Library)
PostgreSQL/Supabase (Database)
Prisma ORM
Vercel (CI/CD Deployment and Server)


# API Overview 

## Main Endpoints:

1. Health Check -> /api/v1/health/check
2. orders -> /api/v1/orders
3. line-items -> /api/v1/line-items
4. audit-logs -> /api/v1/audit-logs

API versioning for future advancements.

[Swagger API Docs](http://localhost:7101/api-docs/) # local server must be running

For details and full API overview see [API integration docs](docs/API_INTEGRATION.md).


# Status Rules

* Pending, Partially paid, paid, overdue
* Invoice can be edited only in Pending Status
* Payment must be greater than 1, validated in the frontend and API
* Over payment restricted, validation in the API


# Tradeoffs

* Prisma ORM - works with most of the database, easy migration and good documentation
* CI/CD - quick deployments and testing 

* Audit-logs - will be easy to trace money trail
* Payment notes - helpful for keeping short and crucial information

# Improvements

* Authentication and Authorization, Multi-Tenant
* Email Notification for Invoice Recipient and Payment Reminder
* OCR-based Invoice capture to store 
* One-time link based payment
* Payment gateway integration


# Development Environment

## containerized application - follow the steps below 

### 1. Clone Repository

`git clone git@github.com:Marshmalow212/order_and_settlement_monorepo.git`

And enter into the project root `cd order_and_settlement_monorepo`

### 2. Run the command `cd backend && cp .env.example .env && cd ../frontend && cp .env.example .env && cd .. && cp .env.example .env` for environment variables configuration. 

* Seperate `.env` files will help to work on either FE or BE seperately without running the other. 
* currently local/development values are already configured

### 3. Run command `docker compose up -d && docker compose logs -f` to run the containers and see logs

### 4. DB Migration `docker exec -it order-settlement-backend npx prisma migrate dev --name init` command

### 4. User Seed `docker exec -it order-settlement-backend npx prisma db seed` command 

### 5. frontend url `http://localhost:7103` and backend url `http://localhost:7101`



## local development

### 1. enter to the directory backend or frontend 

### 2. prepare env file `cp .env.example .env`

### 3. install dependencies `npm i`

### 4. `npm run start` to start the server for backend at `3001`, for frontend at `3000`



# Deployment Ready at Vercel

