"use client";

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { payment } from '@/services/api';

/**
 * Fiuu Payment Button Component
 * Handles payment flow: invoice → payment → success/failure
 * Uses data attributes pattern like WordPress/WooCommerce
 * 
 * @param {object} props
 * @param {number} props.amount - Payment amount (e.g., 1.01)
 * @param {string} props.orderId - Unique order ID
 * @param {string} props.billName - Customer name
 * @param {string} props.billEmail - Customer email
 * @param {string} props.billMobile - Customer mobile number
 * @param {string} props.billDesc - Payment description
 * @param {string} props.channel - Payment channel (default: 'creditAN')
 * @param {function} props.onSuccess - Callback when payment succeeds
 * @param {function} props.onFailure - Callback when payment fails
 * @param {object} props.className - Additional CSS classes
 * @param {string} props.buttonText - Button text (default: 'Pay Now')
 */
export default function FiuuPaymentButton({
  amount,
  orderId,
  billName,
  billEmail,
  billMobile = '',
  billDesc = 'Payment',
  channel = 'creditAN',
  country = 'MY',
  currency = 'MYR',
  onSuccess,
  onFailure,
  className = '',
  buttonText = 'Pay Now',
  disabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState('');
  const buttonRef = useRef(null);
  const paymentParamsRef = useRef(null);
  const molpayScriptLoadedRef = useRef(false);

  // Load MOLPay script after jQuery is loaded
  useEffect(() => {
    const loadMOLPayScript = () => {
      if (molpayScriptLoadedRef.current) return;
      
      if (typeof window === 'undefined' || !window.jQuery) {
        return;
      }

      // Check if MOLPay already loaded
      if (window.jQuery.fn.MOLPaySeamless) {
        console.log('MOLPay Seamless already available');
        setIsReady(true);
        molpayScriptLoadedRef.current = true;
        return;
      }

      // Check if script tag already exists
      if (document.querySelector('script[src*="MOLPay_seamless"]')) {
        // Script tag exists, wait for it to initialize
        const checkInterval = setInterval(() => {
          if (window.jQuery && window.jQuery.fn.MOLPaySeamless) {
            clearInterval(checkInterval);
            setIsReady(true);
            molpayScriptLoadedRef.current = true;
            console.log('MOLPay Seamless initialized from existing script');
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 10000);
        return;
      }

      // Load MOLPay script (using Razer Merchant Services URL like WordPress)
      molpayScriptLoadedRef.current = true;
      const molpayScript = document.createElement('script');
      molpayScript.src = 'https://pay.merchant.razer.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js';
      molpayScript.async = false; // Load synchronously like WordPress
      molpayScript.onload = () => {
        console.log('MOLPay Seamless script loaded');
        // Wait a moment for plugin to initialize
        setTimeout(() => {
          if (window.jQuery && window.jQuery.fn.MOLPaySeamless) {
            setIsReady(true);
            console.log('MOLPay Seamless plugin ready');
          } else {
            console.error('MOLPay Seamless plugin not found after script load');
            setError('Payment gateway plugin failed to initialize');
          }
        }, 300);
      };
      molpayScript.onerror = () => {
        console.error('Failed to load MOLPay Seamless script');
        setError('Failed to load payment gateway script');
        molpayScriptLoadedRef.current = false;
      };
      document.body.appendChild(molpayScript);
    };

    // Check if jQuery is available
    if (typeof window !== 'undefined' && window.jQuery) {
      loadMOLPayScript();
    } else {
      // Wait for jQuery to load
      const checkJQuery = setInterval(() => {
        if (typeof window !== 'undefined' && window.jQuery) {
          clearInterval(checkJQuery);
          loadMOLPayScript();
        }
      }, 100);
      setTimeout(() => clearInterval(checkJQuery), 15000);
      return () => clearInterval(checkJQuery);
    }
  }, []);

  // Initialize payment parameters and MOLPay Seamless
  useEffect(() => {
    const initializePayment = async () => {
      if (!isReady || !buttonRef.current || isInitialized || paymentParamsRef.current) return;

      setIsLoading(true);
      setError('');

      try {
        // Validate required fields
        if (!amount || !orderId || !billName || !billEmail) {
          throw new Error('Missing required payment information');
        }

        // Create payment request (invoice) - get vcode
        const paymentData = {
          amount,
          currency,
          orderId,
          billName,
          billEmail,
          billMobile,
          billDesc,
          channel,
          country,
          returnUrl: `${window.location.origin}/payment/success`,
          notifyUrl: `${window.location.origin}/api/payment/notify`,
        };

        const params = await payment.createPaymentRequest(paymentData);
        paymentParamsRef.current = params;
        console.log('Payment parameters created:', params);

        // Build options object for MOLPay Seamless
        const options = {
          mpsmerchantid: params.mpsmerchantid || '',
          mpschannel: params.mpschannel || channel,
          mpsamount: params.mpsamount || amount.toFixed(2),
          mpsorderid: params.mpsorderid || orderId,
          mpsbill_name: params.mpsbill_name || billName,
          mpsbill_email: params.mpsbill_email || billEmail,
          mpsbill_mobile: params.mpsbill_mobile || billMobile,
          mpsbill_desc: params.mpsbill_desc || billDesc,
          mpscountry: params.mpscountry || country,
          mpscurrency: params.mpscurrency || currency,
          // mpsdomain not included - WooCommerce seamless doesn't use it
          mpsvcode: params.mpsvcode || '',
          mpsreturnurl: params.mpsreturnurl || `${window.location.origin}/payment/success`,
          mpscancelurl: `${window.location.origin}/payment/failed`,
        };
        if (params.mpsnotifyurl) {
          options.mpsnotifyurl = params.mpsnotifyurl;
        }

        // Set data attributes on button (WordPress/WooCommerce pattern)
        const button = buttonRef.current;
        if (button && window.jQuery && window.jQuery.fn.MOLPaySeamless) {
          button.setAttribute('data-toggle', 'molpayseamless');
          button.setAttribute('data-mpsmerchantid', options.mpsmerchantid);
          button.setAttribute('data-mpschannel', options.mpschannel);
          button.setAttribute('data-mpsamount', options.mpsamount);
          button.setAttribute('data-mpsorderid', options.mpsorderid);
          button.setAttribute('data-mpsbill_name', options.mpsbill_name);
          button.setAttribute('data-mpsbill_email', options.mpsbill_email);
          button.setAttribute('data-mpsbill_mobile', options.mpsbill_mobile);
          button.setAttribute('data-mpsbill_desc', options.mpsbill_desc);
          button.setAttribute('data-mpscountry', options.mpscountry);
          button.setAttribute('data-mpscurrency', options.mpscurrency);
          // mpsdomain not included - WooCommerce seamless doesn't use it
          button.setAttribute('data-mpsvcode', options.mpsvcode);
          button.setAttribute('data-mpsreturnurl', options.mpsreturnurl);
          button.setAttribute('data-mpscancelurl', options.mpscancelurl);
          if (options.mpsnotifyurl) {
            button.setAttribute('data-mpsnotifyurl', options.mpsnotifyurl);
          }

          // Initialize MOLPay Seamless directly (document is already ready in React)
          const $ = window.jQuery;
          
          // Remove any existing handlers first
          $(button).off('click.molpay').unbind('click.molpay');
          
          // Initialize MOLPay Seamless
          try {
            $(button).MOLPaySeamless(options);
            setIsInitialized(true);
            console.log('MOLPay Seamless initialized successfully on button');
          } catch (initError) {
            console.error('Error initializing MOLPay Seamless:', initError);
            throw new Error('Failed to initialize payment button');
          }
        } else {
          throw new Error('jQuery or MOLPay Seamless plugin not available');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError(err.message || 'Failed to initialize payment');
        setIsLoading(false);
        if (onFailure) {
          onFailure(err);
        }
      }
    };

    if (isReady && amount && orderId && billName && billEmail && buttonRef.current) {
      initializePayment();
    }
  }, [isReady, amount, orderId, billName, billEmail, billMobile, billDesc, channel, country, currency, onFailure, isInitialized]);

  return (
    <>
      {/* Load jQuery */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"
        strategy="beforeInteractive"
        onError={() => {
          setError('Failed to load jQuery');
        }}
        onLoad={() => {
          console.log('jQuery loaded');
        }}
      />

      <button
        type="button"
        id={`fiuu-pay-button-${orderId}`}
        ref={buttonRef}
        disabled={disabled || isLoading || !isReady || !isInitialized}
        className={`${className} ${disabled || isLoading || !isReady || !isInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Processing...' : !isReady ? 'Loading Payment Gateway...' : !isInitialized ? 'Initializing...' : buttonText}
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </>
  );
}
