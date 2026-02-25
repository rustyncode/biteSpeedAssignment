# Bitespeed Identity Reconciliation Service

## Project Overview
This project is a backend web service designed to reconcile customer identities across multiple purchases and interactions. In e-commerce, customers often use different email addresses or phone numbers over time. This service provides an `/identify` endpoint that intelligently links these fragmented contact details into a single, unified customer profile.

By tracking primary and secondary contacts, the service ensuring that a business has a clear, consolidated view of each customer, regardless of which contact information they provide during a specific checkout process.

### Core Logic
- **Identity Unification:** Automatically links new contact information to existing primary contacts.
- **Conflict Resolution (Merging):** If a customer interaction provides information that spans two previously independent customer "clusters," the service intelligently merges them, designating the older contact as the primary and demoting others to secondary.
- **Clarity:** Returns a structured JSON response containing the primary contact ID along with all associated unique emails, phone numbers, and secondary IDs.

## Tech Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express
- **ORM:** Sequelize
- **Database:** PostgreSQL (Neon)

## Features
- **Identify Endpoint:** Consolidates contact information from incoming requests.
- **Link Reconciliation:** Automatically links new contact info to existing primary contacts.
- **Primary Merging:** Intelligently merges customer clusters when conflicting primary contacts are identified.

## Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/rustyncode/biteSpeedAssignment.git
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   Create a `.env` file in the root directory and add:
   ```env
   PORT=3000
   DATABASE_URL=your_postgresql_connection_string
   ```
4. **Build and start the server:**
   ```bash
   npm run build
   npm start
   ```

## Hosted Application Link
[Insert your deployment link here (e.g., Render, Railway, Vercel)]

## API Usage
### POST `/identify`
Receives an email and/or phone number and returns a consolidated contact profile.

**Request Body:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response Body:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "789012"],
    "secondaryContactIds": [23, 24]
  }
}
```
