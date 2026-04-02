# MS Cinema API Documentation

This document lists the available API endpoints for the MS Cinema web application and mobile integration.

## Table of Contents
- [Authentication APIs](#authentication-apis)
- [Public Content APIs](#public-content-apis)
- [Booking and Order APIs](#booking-and-order-apis)
- [Payment APIs](#payment-apis)
- [Mobile Specific APIs](#mobile-specific-apis)
- [Admin APIs](#admin-apis)
- [System APIs](#system-apis)

---

## Authentication APIs
Endpoints related to user authentication and token management.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/token` | `POST` | Get authentication token from upstream API. |
| `/api/auth/send-activation-email` | `POST` | Send account activation email. |
| `/api/auth/send-forgot-password-email` | `POST` | Send password reset email. |
| `/api/auth/send-ticket-email` | `POST` | Send ticket confirmation email. |
| `/api/admin/login` | `POST` | Admin login endpoint. |

---

## Public Content APIs
General information and content available to all users.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/banners` | `GET` | Fetch active homepage banners. |
| `/api/about` | `GET` | Fetch "About Us" information. |
| `/api/contact` | `POST` | Submit contact form. |
| `/api/contact-info` | `GET`/`POST` | Get or update general contact information. |

---

## Booking and Order APIs
Core business logic for movie bookings and orders.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/orders` | `POST` | Create or update a booking order. |
| `/api/booking/release` | `POST` | Release locked seats (manual or timeout). |
| `/api/hall-booking` | `POST` | Submit a hall booking inquiry. |

---

## Payment APIs
Endpoints for processing payments (Razer/Fiuu).

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/payment/create-request` | `POST` | Create a new payment request for the website. |
| `/api/payment/verify` | `POST` | Verify payment status from gateway. |
| `/api/payment/notify` | `GET`/`POST` | Webhook for payment gateway notifications. |
| `/api/payment/cancel` | `GET` | Handle cancelled payment requests. |
| `/api/payment/save-log` | `POST` | Save payment transaction logs. |

---

## Mobile Specific APIs
Endpoints optimized or created specifically for the Flutter/Mobile application.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/payment/mobile-request` | `POST` | Create payment payload for Mobile SDK integration. |
| `/api/payment/mobile-update` | `POST` | Update order status from mobile app payment result. |
| `/api/payment/mobile-send-ticket` | `POST` | Trigger ticket email specifically for mobile bookings. |

---

## Admin APIs
Management endpoints for the MS Cinema Dashboard.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/dashboard` | `GET` | Fetch dashboard statistics (sales, tickets, orders). |
| `/api/admin/profile` | `PUT` | Manage admin user profile and password. |
| `/api/admin/settings` | `GET`/`POST` | Manage global application settings. |
| `/api/admin/banners` | `GET`/`POST` | List or create homepage banners. |
| `/api/admin/banners/[id]` | `GET`/`PUT`/`DELETE` | Manage a specific banner. |
| `/api/admin/experiences` | `GET`/`POST` | List or create movie experiences. |
| `/api/admin/experiences/[id]` | `PUT`/`DELETE` | Manage a specific experience. |
| `/api/admin/promotions` | `GET`/`POST` | List or create promotions. |
| `/api/admin/promotions/[id]` | `PUT`/`DELETE` | Manage a specific promotion. |
| `/api/admin/pages` | `GET`/`POST` | List or create dynamic pages. |
| `/api/admin/pages/[id]` | `GET`/`PUT`/`DELETE` | Manage a specific dynamic page. |
| `/api/admin/about/general` | `GET`/`POST` | Manage general "About Us" content. |
| `/api/admin/about` | `GET`/`POST` | List or create about section items. |
| `/api/admin/about/[id]` | `GET`/`PUT`/`DELETE` | Manage a specific about section item. |
| `/api/admin/orders` | `GET`/`DELETE` | List, filter, or bulk delete orders. |
| `/api/admin/orders/check-status` | `POST` | Manually check/sync payment status for an order. |
| `/api/admin/orders/refund` | `POST` | Process refund for a paid order. |
| `/api/admin/orders/[id]/status` | `POST` | Update specific order booking or payment status. |
| `/api/admin/orders/[id]/reserve` | `POST` | Manually reserve seats for an order. |
| `/api/admin/orders/[id]/resend-email` | `POST` | Resend confirmation email for an order. |
| `/api/admin/contacts` | `GET` | List/filter received contact messages. |
| `/api/admin/payment-logs` | `GET` | View system payment logs. |

---

## System APIs
Background tasks and infrastructure endpoints.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/upload` | `POST` | General file upload endpoint (images/assets). |
| `/api/cron/release-locked-seats` | `GET` | Scheduled task to release expired seat locks. |
| `/api/proxy` | `GET`/`POST`/`PUT` | Proxy handler for external service requests. |
