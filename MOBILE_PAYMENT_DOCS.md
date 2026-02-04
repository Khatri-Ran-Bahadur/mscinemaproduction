# MS Cinema Mobile Payment Integration Guide

This document provides the definitive guide for integrating the MS Cinema mobile application payment flow using the **Fiuu (formerly Razer Merchant Services) Mobile XDK**.

## 🔐 Security Requirement
All API calls from the mobile application MUST include the static API key in the request headers. Requests without this key or with an invalid key will return a `401 Unauthorized` error.

**Header Key**: `x-api-key`
**Header Value**: `O1gqsNTDMiKdRmqmI9VuBQ8fq7M7YYVghxwCnhQNYsM=`

---

## 🚀 The Payment Flow

To ensure data consistency and prevent double bookings, follow this exact sequence:

1.  **Server Initialization**: Call `/api/payment/mobile-request` to create a local record and get the XDK payload.
2.  **Take Payment**: Launch the Fiuu Mobile XDK using the returned `payload` object.
3.  **Local Status Sync**: Call `/api/payment/mobile-update` to record the payment result in our database.
4.  **Cinema System Sync**: Call the **Upstream Cinema API** (`ReserveBooking`) directly from the mobile app.
5.  **Ticket Delivery**: Call `/api/payment/mobile-send-ticket` to trigger the QR code email to the customer.

---

## 🛠 API Reference

### 1. Create/Sync Payment Request
**Endpoint**: `POST /api/payment/mobile-request`

Call this when the user enters the payment phase. This endpoint is idempotent; if called multiple times with the same `referenceNo`, it will update the existing record.

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
| `sandboxMode` | Boolean | No | Set `true` for sandbox (test) mode. |
| `devMode` | Boolean | No | Set `true` to enable developer mode in the SDK. |

**Response**:
Returns the `payload` object which must be passed directly to the Fiuu Mobile SDK.

```json
{
  "status": true,
  "message": "Mobile payment request created",
  "orderId": "MOB1738615456789",
  "payload": {
    "mp_dev_mode": true,
    "mp_username": "...",
    "mp_password": "...",
    "mp_merchant_ID": "...",
    "mp_app_name": "MSCinemas",
    "mp_verification_key": "...",
    "mp_amount": "18.50",
    "mp_order_ID": "MOB1738615456789",
    "mp_currency": "MYR",
    "mp_country": "MY",
    "mp_channel": "multi",
    "mp_bill_description": "Booking for Gladiator II",
    "mp_bill_name": "John Doe",
    "mp_bill_email": "user@example.com",
    "mp_bill_mobile": "0123456789",
    "mp_bill_name_edit_disabled": true,
    "mp_bill_email_edit_disabled": true,
    "mp_bill_mobile_edit_disabled": true,
    "mp_bill_description_edit_disabled": true,
    "mp_language": "EN",
    "mp_sandbox_mode": true,
    "mp_advanced_email_validation_enabled": true,
    "mp_advanced_phone_validation_enabled": true
    // ... other optional fields
  }
}
```

---

### 2. Update Payment Status (Local Database)
**Endpoint**: `POST /api/payment/mobile-update`

Call this immediately after the SDK returns a transaction status.

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

Call this **only after** your app has successfully called the Upstream Cinema `ReserveBooking` API.

**Request Body**:
```json
{
  "orderId": "MOB...",
  "transactionId": "123456789"
}
```

---

## 🔐 Environment Variables (Server Side)
The following keys must be configured in the `.env` file for the backend:

- `FIUU_MERCHANT_ID`: Your Merchant ID.
- `FIUU_VERIFY_KEY`: Your Verification Key.
- `FIUU_SECRET_KEY`: Your Secret Key.
- `FIUU_USERNAME`: SDK Username.
- `FIUU_PASSWORD`: SDK Password.
- `RMS_APP_NAME`: App name for SDK (e.g., `MSCinemas`).

---

## 📝 Integration Notes
1. **Payload Reuse**: The `payload` returned by `/mobile-request` is pre-configured according to the Fiuu Mobile SDK requirements. You can directly pass this object to the SDK initialization method.
2. **Idempotency**: Using the `referenceNo` (e.g., `B1A...`) ensures that even if a user retries a payment, it is tracked under the same booking reference.
3. **Field Locking**: By default, billing fields are locked (`mp_*_edit_disabled: true`) to ensure they match the booking data.
4. **Language**: The default language is set to `EN`, but can be changed by passing `mp_language` in the request body to `/mobile-request`.
5. **Logging**: Every request made to these APIs is logged in the `PaymentLog` table for auditing and troubleshooting.
