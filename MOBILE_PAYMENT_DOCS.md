# MS Cinema Mobile Payment Integration Guide (Final Version)

This document provides the definitive guide for integrating the MS Cinema mobile application payment flow using Fiuu (formerly Razer Merchant Services) Mobile SDK.

## 🔐 Security Requirement
All API calls from the mobile application MUST include the static API key in the request headers. Requests without this key or with an invalid key will return a `401 Unauthorized` error.

**Header Key**: `x-api-key`
**Header Value**: `O1gqsNTDMiKdRmqmI9VuBQ8fq7M7YYVghxwCnhQNYsM=`

---

## 🚀 The Payment Flow

To ensure data consistency and prevent double bookings, follow this exact sequence:

1.  **Server Initialization**: Call `/mobile-request` to create a local record.
2.  **Take Payment**: Launch the Fiuu Mobile SDK using the payload from step 1.
3.  **Local Status Sync**: Call `/mobile-update` to record the payment result in our database.
4.  **Cinema System Sync**: Call the **Upstream Cinema API** (`ReserveBooking`) directly from the mobile app.
5.  **Ticket Delivery**: Call `/mobile-send-ticket` to trigger the QR code email to the customer.

---

## 🛠 API Reference

### 1. Create/Sync Payment Request
**Endpoint**: `POST /api/payment/mobile-request`

Call this when the user enters the payment phase. This endpoint is idempotent; if called multiple times with the same `referenceNo`, it will update the existing record rather than creating a duplicate.

**Request Body Parameters**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | Number/String | Yes | Total payment amount (e.g., `18.50`). |
| `referenceNo` | String | Yes | The unique booking reference from cinema system (e.g., `B1A...`). |
| `customerEmail` | String | Yes | Customer's email address for ticket delivery. |
| `customerName` | String | No | Customer's full name. |
| `customerPhone` | String | No | Customer's mobile number. |
| `movieTitle` | String | No | Title of the movie. |
| `movieId` | String/Int | No | Internal ID of the movie. |
| `cinemaName` | String | No | Name of the cinema branch. |
| `cinemaId` | String | No | Internal ID of the cinema. |
| `hallName` | String | No | Name of the hall. |
| `showId` | String | No | Internal ID of the showtime. |
| `showTime` | String | No | ISO Date/Time of the show. |
| `seats` | Array/String | No | Selection of seats (e.g., `["A1", "A2"]`). |
| `ticketType` | String | No | Description of ticket categories. |
| `currency` | String | No | Currency code (Default: `MYR`). |
| `country` | String | No | Country code (Default: `MY`). |
| `sandboxMode` | Boolean | No | Set `true` for testing/sandbox environment. |
| `devMode` | Boolean | No | Set `true` for development logging. |

**Example Request**:
```json
{
  "amount": 25.00,
  "referenceNo": "B1A66723",
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "movieTitle": "Gladiator II",
  "seats": ["H10", "H11"],
  "sandboxMode": true
}
```

**Response**:
Returns the `payload` object which must be passed to the Fiuu Mobile SDK.
```json
{
  "status": true,
  "orderId": "MOB173...456",
  "payload": {
    "mp_merchant_ID": "...",
    "mp_app_name": "MSCinemas",
    "mp_amount": "25.00",
    "mp_order_ID": "MOB173...456",
    "mp_verification_key": "...",
    "mp_bill_name": "John Doe",
    "mp_bill_email": "user@example.com",
    "mp_sandbox_mode": true
    // ... other SDK required fields
  }
}
```

---

### 2. Update Payment Status (Local Database)
**Endpoint**: `POST /api/payment/mobile-update`

Call this immediately after the SDK returns a transaction status. This ensures our local dashboard reflects the correct payment state.

**Request Body**:
```json
{
  "orderId": "MOB...",
  "status": "SUCCESS", // or "FAILED"
  "transactionId": "123456789", // From Fiuu SDK
  "channel": "FPX",
  "amount": 18.50
}
```

---

### 3. Send Ticket Email
**Endpoint**: `POST /api/payment/mobile-send-ticket`

Call this **only after** your app has successfully called the Upstream Cinema `ReserveBooking` API. This API fetches the final confirmed details and sends the premium HTML ticket with the QR code.

**Request Body**:
```json
{
  "orderId": "MOB...",
  "transactionId": "123456789"
}
```

---

## 📝 Important Notes
*   **Reference Uniqueness**: We use the Cinema `referenceNo` to track uniqueness. If a user starts a payment, closes it, and tries again for the same seats, our system gracefully reuses the existing order.
*   **Logging**: Every request made to these APIs is logged in the `PaymentLog` table for auditing and troubleshooting.
*   **Web Payment Isolation**: This flow is isolated from the website's `molpay_return` and `molpay_callback` logic, ensuring zero side effects on web booking.
