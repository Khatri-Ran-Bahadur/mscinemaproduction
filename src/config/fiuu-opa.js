/**
 * Centralized Configuration for Fiuu (Razer Merchant Services) Offline Payment API (OPA)
 * Tailored for MS Cinema Self-Service Kiosks.
 * Supports seamless switching between Sandbox and Live via environment variables.
 */

const isLive = (process.env.FIUU_OPA_ENV || process.env.NEXT_PUBLIC_FIUU_OPA_ENV || 'sandbox').toLowerCase() === 'live';

export const FIUU_OPA_CONFIG = {
  isLive,
  environment: isLive ? 'live' : 'sandbox',

  // Service Endpoints
  urls: {
    precreate: isLive
      ? 'https://opa.merchant.razer.com/RMS/API/MOLOPA/precreate.php'
      : 'https://sandbox.merchant.razer.com/RMS/API/MOLOPA/precreate.php',
    inquiry: isLive
      ? 'https://api.merchant.razer.com/RMS/API/MOLOPA/inquiry.php'
      : 'https://sandbox.merchant.razer.com/RMS/API/MOLOPA/inquiry.php',
    reversal: isLive
      ? 'https://api.merchant.razer.com/RMS/API/MOLOPA/reversal.php'
      : 'https://sandbox.merchant.razer.com/RMS/API/MOLOPA/reversal.php',
    payment: isLive
      ? 'https://opa.merchant.razer.com/RMS/API/MOLOPA/payment.php'
      : 'https://sandbox.merchant.razer.com/RMS/API/MOLOPA/payment.php',
  },

  // Credentials (Defaults to MS Cinema Sandbox credentials)
  credentials: {
    merchantId: process.env.FIUU_OPA_MERCHANT_ID || (isLive ? '' : 'SB_mscinema'),
    storeId: process.env.FIUU_OPA_STORE_ID || (isLive ? '' : 'mscinema'),
    applicationCode: process.env.FIUU_OPA_APP_CODE || (isLive ? '' : '7b722873a171b69b7e3028b5e3282b40'),
    secretKey: process.env.FIUU_OPA_SECRET_KEY || (isLive ? '' : '1ab8ecdea3fa97ee8fe1b3399917544c'),
    verifyKey: process.env.FIUU_OPA_VERIFY_KEY || (isLive ? '' : 'e7d9f38bf4e991849888fce42247f3c1'),
  },

  // Version and Hashing defaults per Razer OPA v2.1.6
  version: 'v2',
  hashType: 'hmac-sha256',
  currencyCode: 'MYR',
  defaultTerminalId: process.env.FIUU_OPA_TERMINAL_ID || 'KIOSK01',
};
