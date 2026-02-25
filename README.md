# Bitespeed Identity Reconciliation Service

This service unifies customer identifies across multiple interactions by linking email addresses and phone numbers.

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
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file:
   ```env
   PORT=3000
   DATABASE_URL=your_postgresql_connection_string
   ```
4. Build and start the server:
   ```bash
   npm run build
   npm start
   ```

## API Usage
### POST `/identify`
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
