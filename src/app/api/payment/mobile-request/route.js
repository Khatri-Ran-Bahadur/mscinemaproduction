// /**
//  * API Route: Create Mobile Payment Request for Flutter App
//  * Generates payment request data in Razer Merchant Services Mobile SDK format
//  * This endpoint is specifically for mobile app integration (Flutter/React Native)
//  */

// import { NextResponse } from 'next/server';

// // Razer Merchant Services Configuration from environment variables
// const RMS_CONFIG = {
//   merchantId: process.env.FIUU_MERCHANT_ID || '',
//   verifyKey: process.env.FIUU_VERIFY_KEY || '',
//   secretKey: process.env.FIUU_SECRET_KEY || '',
//   // Optional: App name for mobile SDK
//   appName: process.env.RMS_APP_NAME || 'MSCinemas',
//   // Optional: Username and password for sandbox (if needed)
//   username: process.env.RMS_USERNAME || '',
//   password: process.env.RMS_PASSWORD || '',
// };

// // Validate configuration
// if (!RMS_CONFIG.merchantId || !RMS_CONFIG.verifyKey) {
//   console.error('Razer Merchant Services credentials are not configured in environment variables');
// }

// /**
//  * Generate order ID if not provided
//  */
// function generateOrderId(referenceNo = '') {
//   const timestamp = Date.now();
//   const random = Math.random().toString(36).substr(2, 9);
//   if (referenceNo) {
//     return `MS${timestamp}${random}_${referenceNo}`;
//   }
//   return `MS${timestamp}${random}`;
// }

// export async function POST(request) {
//   try {
//     const paymentData = await request.json();
    
//     // Extract payment fields
//     const {
//       amount, // Payment amount (required, minimum 1.01)
//       orderId, // Order ID (optional, will be generated if not provided)
//       currency = 'MYR', // Currency code (default: MYR)
//       country = 'MY', // Country code (default: MY)
      
//       // Customer information (optional)
//       billName = '', // Customer name
//       billEmail = '', // Customer email
//       billMobile = '', // Customer mobile
//       billDescription = '', // Payment description
      
//       // Booking information (optional, for tracking)
//       referenceNo = '', // Booking reference number
//       cinemaId = '', // Cinema ID
//       showId = '', // Show ID
//       membershipId = '', // Membership ID
      
//       // Mobile SDK specific options
//       channel = '', // Payment channel (empty = show all, 'multi' = all channels, or specific channel)
//       channelEditing = false, // Allow channel selection
//       editingEnabled = false, // Allow billing information editing
      
//       // Advanced options
//       isEscrow = '0', // Escrow option ('0' = disabled, '1' = enabled)
//       binLock = [], // BIN restrictions (array of BIN codes)
//       binLockErrMsg = '', // BIN lock error message
//       preferredToken = '', // Preferred token ID
//       tcctype = '', // Credit card transaction type ('AUTH' for authorization)
//       isRecurring = false, // Recurring payment
//       allowedChannels = [], // Allowed channels array (e.g., ['credit', 'credit3'])
//       disabledChannels = [], // Disabled channels array
      
//       // UI/UX options
//       language = 'EN', // Language code (EN, MS, VI, TH, FIL, MY, KM, ID, ZH)
//       customCssUrl = '', // Custom CSS URL for payment screen
//       expressMode = false, // Skip payment info page and go direct to payment
//       sandboxMode = false, // Sandbox mode for testing
//       devMode = false, // Development mode
      
//       // Validation options
//       advancedEmailValidation = true, // Extended email validation
//       advancedPhoneValidation = true, // Extended phone validation
      
//       // Field editing options
//       billNameEditDisabled = false,
//       billEmailEditDisabled = false,
//       billMobileEditDisabled = false,
//       billDescriptionEditDisabled = false,
      
//       // Other options
//       cashWaittime = 48, // Cash channel payment expiration (hours)
//       non3DS = false, // Allow bypass of 3DS
//       cardListDisabled = false, // Disable card list option
//     } = paymentData;

//     // Validate required fields
//     if (!amount || parseFloat(amount) < 1.01) {
//       return NextResponse.json(
//         {
//           status: false,
//           error: 'Invalid amount. Minimum amount is 1.01',
//         },
//         { status: 400 }
//       );
//     }

//     // Generate order ID if not provided
//     const finalOrderId = orderId || generateOrderId(referenceNo);

//     // Format amount to 2 decimal places
//     const formattedAmount = parseFloat(amount).toFixed(2);

//     // Build mobile payment request data
//     const mobilePaymentData = {
//       // Development mode (optional, required when using online Sandbox environment)
//       mp_dev_mode: devMode || false,

//       // Mandatory: Merchant credentials
//       mp_username: RMS_CONFIG.username || '',
//       mp_password: RMS_CONFIG.password || '',
//       mp_merchant_ID: RMS_CONFIG.merchantId,
//       mp_app_name: RMS_CONFIG.appName,
//       mp_verification_key: RMS_CONFIG.verifyKey,

//       // Mandatory: Payment values
//       mp_amount: formattedAmount,
//       mp_order_ID: finalOrderId,
//       mp_currency: currency.toUpperCase(),
//       mp_country: country.toUpperCase(),

//       // Optional: Customer information
//       mp_bill_name: billName || '',
//       mp_bill_email: billEmail || '',
//       mp_bill_mobile: billMobile || '',
//       mp_bill_description: billDescription || '',

//       // Optional: Channel selection
//       mp_channel: channel || '', // Empty = show all, 'multi' = all channels, or specific channel
//       mp_channel_editing: channelEditing || false,
//       mp_editing_enabled: editingEnabled || false,

//       // Optional: Escrow
//       mp_is_escrow: isEscrow || '0',

//       // Optional: BIN restrictions
//       ...(binLock.length > 0 && { mp_bin_lock: binLock }),
//       ...(binLockErrMsg && { mp_bin_lock_err_msg: binLockErrMsg }),

//       // Optional: Transaction query (WARNING: For transaction query use only)
//       ...(paymentData.mp_transaction_id && { mp_transaction_id: paymentData.mp_transaction_id }),
//       ...(paymentData.mp_request_type && { mp_request_type: paymentData.mp_request_type }),

//       // Optional: UI customization
//       ...(customCssUrl && { mp_custom_css_url: customCssUrl }),

//       // Optional: Token preferences
//       ...(preferredToken && { mp_preferred_token: preferredToken }),

//       // Optional: Credit card transaction type
//       ...(tcctype && { mp_tcctype: tcctype }),

//       // Optional: Recurring payment
//       mp_is_recurring: isRecurring || false,

//       // Optional: Channel restrictions
//       ...(allowedChannels.length > 0 && { mp_allowed_channels: allowedChannels }),
//       ...(disabledChannels.length > 0 && { mp_disabled_channels: disabledChannels }),

//       // Optional: Sandbox and express mode
//       mp_sandbox_mode: sandboxMode || false,
//       mp_express_mode: expressMode || false,

//       // Optional: Validation options
//       mp_advanced_email_validation_enabled: advancedEmailValidation !== false,
//       mp_advanced_phone_validation_enabled: advancedPhoneValidation !== false,

//       // Optional: Field editing restrictions
//       mp_bill_name_edit_disabled: billNameEditDisabled || false,
//       mp_bill_email_edit_disabled: billEmailEditDisabled || false,
//       mp_bill_mobile_edit_disabled: billMobileEditDisabled || false,
//       mp_bill_description_edit_disabled: billDescriptionEditDisabled || false,

//       // Optional: Language
//       mp_language: language || 'EN',

//       // Optional: Cash channel wait time
//       mp_cash_waittime: cashWaittime || 48,

//       // Optional: 3DS bypass
//       mp_non_3DS: non3DS || false,

//       // Optional: Card list
//       mp_card_list_disabled: cardListDisabled || false,
//     };

//     // Remove empty optional fields to keep response clean
//     Object.keys(mobilePaymentData).forEach((key) => {
//       if (
//         mobilePaymentData[key] === '' ||
//         mobilePaymentData[key] === null ||
//         mobilePaymentData[key] === undefined
//       ) {
//         // Keep mandatory fields even if empty, remove only truly optional empty fields
//         const optionalFields = [
//           'mp_username',
//           'mp_password',
//           'mp_bill_name',
//           'mp_bill_email',
//           'mp_bill_mobile',
//           'mp_bill_description',
//           'mp_channel',
//           'mp_custom_css_url',
//           'mp_preferred_token',
//           'mp_tcctype',
//           'mp_transaction_id',
//           'mp_request_type',
//         ];
//         if (optionalFields.includes(key)) {
//           delete mobilePaymentData[key];
//         }
//       }
//     });

//     // Return success response with mobile payment data
//     return NextResponse.json({
//       status: true,
//       message: 'Mobile payment request data generated successfully',
//       data: mobilePaymentData,
//       // Include booking reference for tracking (optional)
//       ...(referenceNo && { referenceNo }),
//       ...(cinemaId && { cinemaId }),
//       ...(showId && { showId }),
//       ...(membershipId && { membershipId }),
//     });
//   } catch (error) {
//     console.error('Error creating mobile payment request:', error);
//     return NextResponse.json(
//       {
//         status: false,
//         error: error.message || 'Failed to create mobile payment request',
//       },
//       { status: 500 }
//     );
//   }
// }
