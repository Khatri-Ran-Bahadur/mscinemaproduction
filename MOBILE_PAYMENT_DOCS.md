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

**Request Body Highlights**:
*   `referenceNo`: The unique booking reference from the cinema system (e.g., `B1A...`).
*   `amount`: The total price to charge.
*   `seats`: Can be a string or JSON array of seat numbers.

**Response**:
Returns the `payload` object which should be passed directly to the Fiuu Mobile SDK initialization.

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
