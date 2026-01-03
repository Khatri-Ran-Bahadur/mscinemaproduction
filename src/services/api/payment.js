/**
 * Fiuu Payment Gateway Service
 * Integration with Fiuu payment gateway for processing payments
 * Documentation: https://github.com/FiuuPayment/
 */

// Fiuu Payment Gateway Configuration
// Note: API keys are stored in environment variables and used server-side only
// This is just for URL configuration
const FIUU_CONFIG = {
  // API endpoints - Can be overridden via environment variable
  apiUrl: process.env.NEXT_PUBLIC_FIUU_API_URL || 'https://sandbox.molpay.com/MOLPay/pay',
};

/**
 * Create payment request via API route (secure server-side signature generation)
 * @param {object} paymentData - Payment information
 * @param {number} paymentData.amount - Payment amount (e.g., 1.01)
 * @param {string} paymentData.currency - Currency code (default: MYR)
 * @param {string} paymentData.orderId - Unique order/reference ID
 * @param {string} paymentData.billName - Customer name
 * @param {string} paymentData.billEmail - Customer email
 * @param {string} paymentData.billMobile - Customer mobile number
 * @param {string} paymentData.billDesc - Payment description
 * @param {string} paymentData.returnUrl - Success return URL
 * @param {string} paymentData.notifyUrl - Server notification URL (optional)
 * @returns {Promise<object>} - Payment request parameters with signature
 */
export const createPaymentRequest = async (paymentData) => {
  try {
    const response = await fetch('/api/payment/create-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment request');
    }

    const data = await response.json();
    return data.params;
  } catch (error) {
    console.error('Error creating payment request:', error);
    throw error;
  }
};

/**
 * Verify payment response signature from Fiuu
 * Note: This should be done server-side in production
 * @param {object} responseData - Response data from Fiuu
 * @returns {Promise<boolean>} - True if signature is valid
 */
export const verifyPaymentResponse = async (responseData) => {
  try {
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('Error verifying payment response:', error);
    return false;
  }
};

/**
 * Get payment gateway URL (hosted payment page)
 * @returns {string} - Payment gateway URL
 */
export const getPaymentGatewayUrl = () => {
  return FIUU_CONFIG.apiUrl;
};

/**
 * Initialize MOLPay Seamless payment
 * This uses the MOLPaySeamless jQuery plugin for seamless payment integration
 * @param {string} buttonId - ID of the button element to initialize
 * @param {object} paymentParams - Payment parameters from createPaymentRequest
 */
export const initSeamlessPayment = (buttonId, paymentParams) => {
  if (typeof window === 'undefined' || !window.jQuery || !window.jQuery.fn.MOLPaySeamless) {
    console.error('jQuery and MOLPay Seamless plugin must be loaded');
    return;
  }

  const $ = window.jQuery;
  $(document).ready(function() {
    $(`#${buttonId}`).MOLPaySeamless(paymentParams);
  });
};

/**
 * Redirect to Fiuu payment gateway (hosted payment page method)
 * This creates a form and submits it to redirect to Fiuu's hosted payment page
 * @param {object} paymentParams - Payment parameters from createPaymentRequest
 */
export const redirectToPaymentGateway = (paymentParams) => {
  const gatewayUrl = getPaymentGatewayUrl();

  // Create a form and submit it to redirect to payment gateway
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gatewayUrl;

  // Add all parameters as hidden inputs
  Object.keys(paymentParams).forEach(key => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = paymentParams[key];
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

export default {
  createPaymentRequest,
  verifyPaymentResponse,
  getPaymentGatewayUrl,
  redirectToPaymentGateway,
  initSeamlessPayment,
  config: FIUU_CONFIG,
};
