# Email API Documentation

This document provides comprehensive API documentation for the email sending endpoints used in the MS Cinema application. These APIs can be called by the backend or mobile developers to send activation, password reset, and ticket confirmation emails.

## Table of Contents

1. [Send Activation Email](#1-send-activation-email)
2. [Send Forgot Password Email](#2-send-forgot-password-email)
3. [Send Ticket Email](#3-send-ticket-email)
4. [Error Responses](#error-responses)
5. [Environment Configuration](#environment-configuration)

---

## 1. Send Activation Email

Sends an activation email to a newly registered user with an encrypted activation link.

### Endpoint

```
POST /api/auth/send-activation-email
```

### Request

#### Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "userId": "string (required)",
  "email": "string (required)",
  "name": "string (optional)"
}
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The user ID to be encrypted in the activation link |
| `email` | string | Yes | Recipient email address |
| `name` | string | No | User's name (defaults to "User" if not provided) |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Activation email sent successfully",
  "activationUrl": "http://localhost:3000/activate?userId=WkMdUg",
  "encryptedUserId": "WkMdUg",
  "messageId": "<message-id-from-email-service>"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `message` | string | Success message |
| `activationUrl` | string | The complete activation URL with encrypted user ID |
| `encryptedUserId` | string | The encrypted user ID used in the URL |
| `messageId` | string | Email service message ID (for tracking) |

### Example Request

```bash
curl -X POST http://localhost:3000/api/auth/send-activation-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "5",
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Activation email sent successfully",
  "activationUrl": "http://localhost:3000/activate?userId=WkMdUg",
  "encryptedUserId": "WkMdUg",
  "messageId": "<20240101120000.123456@example.com>"
}
```

### Notes

- The `userId` is automatically encrypted using the application's encryption key
- The activation URL is generated using `NEXT_PUBLIC_BASE_URL` environment variable
- The email contains a styled HTML template with activation instructions
- The activation link expires based on your application's logic (check the `/activate` page)

---

## 2. Send Forgot Password Email

Sends a password reset email to a user with an encrypted reset link containing user ID and token.

### Endpoint

```
POST /api/auth/send-forgot-password-email
```

### Request

#### Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "userId": "string (required)",
  "email": "string (required)",
  "token": "string (required)"
}
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The user ID to be encrypted in the reset link |
| `email` | string | Yes | Recipient email address |
| `token` | string | Yes | Password reset token (should be generated and stored securely) |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "resetUrl": "http://localhost:3000/reset-password?userId=WkMdUg&token=abc123xyz",
  "encryptedUserId": "WkMdUg",
  "messageId": "<message-id-from-email-service>"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `message` | string | Success message |
| `resetUrl` | string | The complete password reset URL with encrypted user ID and token |
| `encryptedUserId` | string | The encrypted user ID used in the URL |
| `messageId` | string | Email service message ID (for tracking) |

### Example Request

```bash
curl -X POST http://localhost:3000/api/auth/send-forgot-password-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "5",
    "email": "user@example.com",
    "token": "abc123xyz789reset"
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "resetUrl": "http://localhost:3000/reset-password?userId=WkMdUg&token=abc123xyz789reset",
  "encryptedUserId": "WkMdUg",
  "messageId": "<20240101120000.123456@example.com>"
}
```

### Notes

- The `userId` is automatically encrypted using the application's encryption key
- The `token` should be URL-encoded in the reset link (handled automatically)
- The reset URL is generated using `NEXT_PUBLIC_BASE_URL` environment variable
- The email contains a styled HTML template with password reset instructions
- **Important**: The reset link expires after 1 hour (3600 seconds). Store the token with a timestamp and validate it on the reset password page
- Generate a secure random token (e.g., using crypto.randomBytes or uuid)

---

## 3. Send Ticket Email

Sends a ticket confirmation email with complete ticket details, seat information, and barcode after successful payment.

### Endpoint

```
POST /api/auth/send-ticket-email
```

### Request

#### Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "string (required)",
  "ticketInfo": {
    "customerName": "string (optional, default: 'Guest')",
    "movieName": "string (optional, default: 'Unknown Movie')",
    "movieImage": "string (optional, default: '/img/banner.jpg')",
    "genre": "string (optional, default: 'N/A')",
    "duration": "string (optional, default: 'N/A')",
    "language": "string (optional, default: 'English')",
    "experienceType": "string (optional, default: 'Standard')",
    "hallName": "string (optional, default: 'N/A')",
    "cinemaName": "string (optional, default: 'N/A')",
    "showDate": "string (optional, default: '')",
    "showTime": "string (optional, default: '')",
    "seatDisplay": [
      {
        "type": "string",
        "seats": ["string"]
      }
    ],
    "totalPersons": "number (optional, default: 0)",
    "bookingId": "string (optional, default: 'N/A')",
    "trackingId": "string (optional, default: 'N/A')"
  }
}
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Recipient email address |
| `ticketInfo` | object | Yes | Complete ticket information object |
| `ticketInfo.customerName` | string | No | Customer's name |
| `ticketInfo.movieName` | string | No | Movie title |
| `ticketInfo.movieImage` | string | No | URL to movie poster image |
| `ticketInfo.genre` | string | No | Movie genre |
| `ticketInfo.duration` | string | No | Movie duration (e.g., "120 min") |
| `ticketInfo.language` | string | No | Movie language |
| `ticketInfo.experienceType` | string | No | Experience type (2D, 3D, ATMOS, etc.) |
| `ticketInfo.hallName` | string | No | Cinema hall name |
| `ticketInfo.cinemaName` | string | No | Cinema location name |
| `ticketInfo.showDate` | string | No | Show date (ISO format or readable string) |
| `ticketInfo.showTime` | string | No | Show time (24-hour format, e.g., "14:30") |
| `ticketInfo.seatDisplay` | array | No | Array of seat groups, each with type and seats array |
| `ticketInfo.totalPersons` | number | No | Total number of persons/tickets |
| `ticketInfo.bookingId` | string | No | Booking/Reference ID (used for barcode) |
| `ticketInfo.trackingId` | string | No | Transaction/Tracking ID |

#### Seat Display Structure

```json
{
  "seatDisplay": [
    {
      "type": "Adult",
      "seats": ["A1", "A2", "A3"]
    },
    {
      "type": "Kids",
      "seats": ["B5"]
    },
    {
      "type": "VIP",
      "seats": ["C10", "C11"]
    }
  ]
}
```

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Ticket email sent successfully",
  "messageId": "<message-id-from-email-service>"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `message` | string | Success message |
| `messageId` | string | Email service message ID (for tracking) |

### Example Request

```bash
curl -X POST http://localhost:3000/api/auth/send-ticket-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "ticketInfo": {
      "customerName": "John Doe",
      "movieName": "The Matrix",
      "movieImage": "https://example.com/posters/matrix.jpg",
      "genre": "Sci-Fi, Action",
      "duration": "136 min",
      "language": "English",
      "experienceType": "3D",
      "hallName": "Hall 1",
      "cinemaName": "MS Cinema Downtown",
      "showDate": "2024-01-15",
      "showTime": "14:30",
      "seatDisplay": [
        {
          "type": "Adult",
          "seats": ["A5", "A6"]
        },
        {
          "type": "Kids",
          "seats": ["A7"]
        }
      ],
      "totalPersons": 3,
      "bookingId": "BK123456789",
      "trackingId": "TXN987654321"
    }
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Ticket email sent successfully",
  "messageId": "<20240101120000.123456@example.com>"
}
```

### Notes

- The email includes a barcode generated from the `bookingId` using Code128 format
- The barcode URL is: `https://barcode.tec-it.com/barcode.ashx?data={bookingId}&code=Code128&translate-esc=on`
- Date and time are automatically formatted for display (e.g., "Jan 15, 2024" and "2:30 PM")
- The email template mirrors the ticket modal design with dark theme
- All optional fields have sensible defaults, but providing complete information ensures better user experience
- The `seatDisplay` array groups seats by ticket type for better readability

---

## Error Responses

All endpoints return consistent error responses in the following format:

### 400 Bad Request

```json
{
  "error": "Error message describing what is missing or invalid"
}
```

**Common 400 Errors:**
- Missing required fields (userId, email, token, etc.)
- Invalid data format
- Missing ticketInfo object

### 500 Internal Server Error

```json
{
  "error": "Failed to send [email type] email",
  "message": "Detailed error message from the system"
}
```

**Common 500 Errors:**
- Email service configuration issues
- Network errors
- Email service provider errors
- Missing environment variables

### Example Error Response

```json
{
  "error": "User ID and email are required"
}
```

---

## Environment Configuration

These APIs require email service configuration via environment variables. See `EMAIL_SETUP.md` for detailed setup instructions.

### Required Environment Variables

```env
# Email Service Configuration
EMAIL_SERVICE=smtp                    # Options: smtp, gmail, sendgrid
EMAIL_HOST=smtp.gmail.com            # SMTP host (for smtp service)
EMAIL_PORT=587                       # SMTP port
EMAIL_SECURE=false                   # Use SSL/TLS
EMAIL_USER=your-email@gmail.com      # Email account username
EMAIL_PASSWORD=your-app-password     # Email account password or app password
EMAIL_FROM=your-email@gmail.com      # From email address
EMAIL_REJECT_UNAUTHORIZED=true      # Reject unauthorized certificates

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Base URL for generating links
```

### Email Service Options

1. **SMTP (Generic)**: Use any SMTP server
   - Set `EMAIL_SERVICE=smtp`
   - Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`

2. **Gmail**: Simplified Gmail configuration
   - Set `EMAIL_SERVICE=gmail`
   - Configure `EMAIL_USER` and `EMAIL_PASSWORD` (use App Password)
   - See Gmail setup in `EMAIL_SETUP.md`

3. **SendGrid**: SendGrid service
   - Set `EMAIL_SERVICE=sendgrid`
   - Configure `SENDGRID_API_KEY` or use `EMAIL_PASSWORD` for API key
   - Set `EMAIL_FROM` to your verified sender email

---

## Integration Examples

### Frontend (React/Next.js)

```javascript
// Send activation email after registration
const sendActivationEmail = async (userId, email, name) => {
  try {
    const response = await fetch('/api/auth/send-activation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        name,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send activation email');
    }

    console.log('Activation email sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending activation email:', error);
    throw error;
  }
};
```

### Backend/Mobile Integration

```javascript
// Example: Send forgot password email
const sendPasswordResetEmail = async (userId, email, resetToken) => {
  const response = await fetch('https://your-domain.com/api/auth/send-forgot-password-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      email,
      token: resetToken,
    }),
  });

  return await response.json();
};
```

### Ticket Email After Payment

```javascript
// Send ticket email after successful payment
const sendTicketConfirmation = async (email, ticketData) => {
  const ticketInfo = {
    customerName: ticketData.customerName,
    movieName: ticketData.movieName,
    movieImage: ticketData.posterUrl,
    genre: ticketData.genre,
    duration: ticketData.duration,
    language: ticketData.language,
    experienceType: ticketData.experienceType,
    hallName: ticketData.hallName,
    cinemaName: ticketData.cinemaName,
    showDate: ticketData.showDate,
    showTime: ticketData.showTime,
    seatDisplay: ticketData.seatGroups, // Array of {type, seats: []}
    totalPersons: ticketData.totalTickets,
    bookingId: ticketData.bookingId,
    trackingId: ticketData.transactionId,
  };

  const response = await fetch('/api/auth/send-ticket-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      ticketInfo,
    }),
  });

  return await response.json();
};
```

---

## Best Practices

1. **Error Handling**: Always handle errors gracefully and provide user feedback
2. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
3. **Token Security**: Generate secure, random tokens for password reset (use crypto.randomBytes)
4. **Token Expiration**: Store token timestamps and validate expiration (1 hour for password reset)
5. **Email Validation**: Validate email addresses before sending
6. **Logging**: Log email sending attempts for debugging and auditing
7. **Testing**: Test email templates in different email clients
8. **Barcode**: Ensure bookingId is unique and valid for barcode generation
9. **Base URL**: Use environment variables for base URL to support different environments
10. **Retry Logic**: Implement retry logic for failed email sends in production

---

## Support

For issues or questions:
- Check `EMAIL_SETUP.md` for email service configuration
- Verify environment variables are set correctly
- Check email service provider logs
- Review application logs for detailed error messages

---

**Last Updated**: January 2024  
**API Version**: 1.0

