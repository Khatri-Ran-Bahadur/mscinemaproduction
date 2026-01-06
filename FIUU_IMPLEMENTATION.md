# Fiuu Seamless Integration v3.28 - Full Implementation

## Official Documentation
Based on: https://github.com/FiuuPayment/Integration-Fiuu_JavaScript_Seamless_Integration/wiki/Fiuu-Seamless-Integration-v3.28-(non-PCI)

## Implementation Summary

### ✅ Completed Changes

1. **jQuery Version Updated**
   - Changed from jQuery 1.11.3 to **jQuery 3.5.1** (as per official documentation)
   - Location: `/var/www/mscinemas/src/app/test-payment/page.js`

2. **MOLPay Seamless Plugin URL**
   - Sandbox: `https://sandbox.merchant.razer.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js`
   - Production: `https://pay.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js`
   - Location: `/var/www/mscinemas/src/app/test-payment/page.js` (line 125)

3. **Form Implementation (Official Method)**
   - Form submission handler fetches payment parameters from server
   - Sets `data-toggle="molpayseamless"` on button
   - Sets all required `data-mps*` attributes
   - Calls `$(button).MOLPaySeamless()` to initialize payment
   - Location: `/var/www/mscinemas/src/app/test-payment/page.js`

4. **Removed Dummy Data**
   - All form fields now start empty (no pre-filled test data)
   - User must enter real information: name, email, mobile, address
   - Location: `/var/www/mscinemas/src/app/test-payment/page.js`

5. **VCode Generation (Server-Side)**
   - ✅ VCode is generated server-side (NOT in JavaScript) - Security requirement
   - Formula: `MD5(amount + merchantid + orderid + verifykey)`
   - Location: `/var/www/mscinemas/src/app/api/payment/create-request/route.js`

## Payment Flow

### Step 1: User Fills Form
- User enters: First Name, Last Name, Email, Phone, Address
- User clicks "Proceed to Payment"

### Step 2: Server Generates Payment Parameters
- Form data sent to: `POST /api/payment/create-request`
- Server generates:
  - Order ID (unique)
  - VCode (MD5 signature)
  - All payment parameters

### Step 3: Initialize MOLPay Seamless
- Payment parameters returned to client
- Button gets `data-toggle="molpayseamless"` and all `data-mps*` attributes
- `$(button).MOLPaySeamless()` is called
- Payment modal opens showing ALL available payment methods

### Step 4: User Selects Payment Method
- User chooses from available methods (Credit Card, FPX, eWallets, etc.)
- Completes payment on Razer Merchant Services

### Step 5: Return URL
- Razer redirects to: `/molpay_return`
- Server verifies payment signature (`skey`)
- User redirected to success/failure page

## Required Parameters (Official Fiuu Documentation)

### Mandatory Parameters (M)
- `mpsmerchantid` - Merchant ID
- `mpsamount` - Payment amount (min: 1.01)
- `mpsorderid` - Unique order ID
- `mpsbill_name` - Customer name
- `mpsbill_email` - Customer email
- `mpsbill_mobile` - Customer mobile
- `mpsbill_desc` - Payment description
- `mpscountry` - Country code (e.g., "MY")
- `mpscurrency` - Currency code (e.g., "MYR")
- `mpsvcode` - Verification code (MD5 signature)
- `mpsreturnurl` - Return URL after payment
- `mpscancelurl` - Cancel URL
- `mpslangcode` - Language code (e.g., "en")
- `mpsapiversion` - API version ("3.28")

### Optional Parameters (O)
- `mpschannel` - Payment channel (omitted = shows all methods)
- `mpstimer` - Payment timer in minutes
- `mpstimerbox` - CSS selector for timer display
- `mpsnotifyurl` - Server-to-server notification URL

### Parameters NOT Required
- ❌ `mpsdomain` - NOT required for Seamless API (plugin handles it automatically)

## Security Notes

1. **VCode Generation**: ✅ Server-side only (NOT in JavaScript)
2. **Verify Key**: ✅ Never exposed to client
3. **Secret Key**: ✅ Server-side only
4. **HTTPS**: Required in production

## Testing

### Test Payment Page
URL: `https://mscinemas.billvoize.in/test-payment`

### Steps to Test:
1. Visit the test payment page
2. Fill in all required fields with **real information** (no dummy data)
3. Click "Proceed to Payment"
4. Payment modal should open showing all available payment methods
5. Select a payment method and complete the transaction
6. You will be redirected to the return URL

### Current Configuration
- **Merchant ID**: `MScinema_Dev` (Sandbox)
- **Environment**: Sandbox
- **Currency**: MYR
- **API Version**: 3.28

## Important Notes

1. **Domain Registration**: Register your domain (`mscinemas.billvoize.in`) with Fiuu support: support@fiuu.com

2. **Currency Enablement**: Ensure MYR currency is enabled in your Razer Merchant Services merchant portal

3. **Payment Methods**: Omitting `mpschannel` shows ALL available payment methods enabled in your merchant account

4. **Sandbox vs Production**:
   - Sandbox: `https://sandbox.merchant.razer.com/...`
   - Production: `https://pay.fiuu.com/...`

## Files Modified

1. `/var/www/mscinemas/src/app/test-payment/page.js`
   - Updated jQuery to 3.5.1
   - Removed dummy form data
   - Implemented official Fiuu form submission method
   - Added proper MOLPay Seamless initialization

2. `/var/www/mscinemas/src/app/api/payment/create-request/route.js`
   - Already correctly generates vcode server-side
   - Returns all required payment parameters

3. `/var/www/mscinemas/src/app/molpay_return/route.js`
   - Handles payment return from Razer Merchant Services
   - Verifies payment signature

## Support

- **Technical Support**: support@fiuu.com
- **Documentation**: https://github.com/FiuuPayment/Integration-Fiuu_JavaScript_Seamless_Integration/wiki/Fiuu-Seamless-Integration-v3.28-(non-PCI)

