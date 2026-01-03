/**
 * Custom hook for Fiuu Payment Integration
 * Handles payment flow: invoice → payment → success/failure
 */

import { useState, useCallback } from 'react';
import { payment } from '@/services/api';

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create payment invoice and initialize payment
   * @param {object} paymentData - Payment information
   * @returns {Promise<object>} - Payment parameters ready for MOLPay Seamless
   */
  const createPaymentInvoice = useCallback(async (paymentData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const {
        amount,
        orderId,
        billName,
        billEmail,
        billMobile = '',
        billDesc = 'Payment',
        channel = 'credit',
        country = 'MY',
        currency = 'MYR',
      } = paymentData;

      // Validate required fields
      if (!amount || !orderId || !billName || !billEmail) {
        throw new Error('Missing required payment information');
      }

      // Create payment request (invoice)
      const params = await payment.createPaymentRequest({
        amount,
        currency,
        orderId,
        billName,
        billEmail,
        billMobile,
        billDesc,
        channel,
        country,
        returnUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success`,
        notifyUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/payment/notify`,
      });

      setIsProcessing(false);
      return params;
    } catch (err) {
      setError(err.message || 'Failed to create payment invoice');
      setIsProcessing(false);
      throw err;
    }
  }, []);

  /**
   * Verify payment response
   * @param {object} responseData - Payment response from Fiuu
   * @returns {Promise<boolean>} - True if payment is valid
   */
  const verifyPayment = useCallback(async (responseData) => {
    try {
      return await payment.verifyPaymentResponse(responseData);
    } catch (err) {
      setError(err.message || 'Failed to verify payment');
      return false;
    }
  }, []);

  return {
    createPaymentInvoice,
    verifyPayment,
    isProcessing,
    error,
  };
}

