"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function TestPaymentPage() {
  const router = useRouter();
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    billingFirstName: '',
    billingLastName: '',
    billingEmail: '',
    billingMobile: '',
    billingAddress: '',
    currency: 'MYR',
    total_amount: '1.01',
    paymentChannel: '', // Empty = show all methods, or specify channel like 'fpx_mb2u', 'creditAN', etc.
    molpaytimer: '',
    molpaytimerbox: '',
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scriptsLoadedRef = useRef(false);
  const loadingScriptsRef = useRef(false);

  // Load jQuery and MOLPay Seamless scripts
  useEffect(() => {
    if (typeof window === 'undefined' || scriptsLoadedRef.current || loadingScriptsRef.current) {
      return;
    }

    loadingScriptsRef.current = true;

    const loadjQuery = () => {
      if (window.jQuery) {
        console.log('jQuery already loaded');
        loadMOLPayScript();
        return;
      }

      if (document.querySelector('script[src*="jquery"]')) {
        console.log('jQuery script tag exists, waiting...');
        let attempts = 0;
        const checkJQuery = setInterval(() => {
          attempts++;
          if (window.jQuery) {
            clearInterval(checkJQuery);
            console.log('jQuery loaded from existing script');
            loadMOLPayScript();
          } else if (attempts > 150) {
            clearInterval(checkJQuery);
            loadingScriptsRef.current = false;
            setError('jQuery failed to load. Please refresh the page.');
          }
        }, 100);
        return;
      }

      console.log('Loading jQuery...');
      const jQueryScript = document.createElement('script');
      // Official Fiuu documentation requires jQuery 3.5.1
      jQueryScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
      jQueryScript.async = false;
      jQueryScript.onload = () => {
        console.log('jQuery script loaded');
        setTimeout(() => {
          if (window.jQuery) {
            console.log('jQuery is available in window');
            loadMOLPayScript();
          } else {
            console.error('jQuery not available in window after script load');
            loadingScriptsRef.current = false;
            setError('jQuery failed to initialize. Please refresh the page.');
          }
        }, 200);
      };
      jQueryScript.onerror = () => {
        console.error('Failed to load jQuery script');
        loadingScriptsRef.current = false;
        setError('Failed to load jQuery. Please check your internet connection.');
      };
      document.head.appendChild(jQueryScript);
    };

    const loadMOLPayScript = () => {
      if (!window.jQuery) {
        console.log('jQuery not available, cannot load MOLPay');
        loadingScriptsRef.current = false;
        return;
      }

      console.log('jQuery is available, checking MOLPay...');
      if (window.jQuery.fn && window.jQuery.fn.MOLPaySeamless) {
        console.log('MOLPay Seamless already loaded');
        setIsReady(true);
        scriptsLoadedRef.current = true;
        loadingScriptsRef.current = false;
        return;
      }

      if (document.querySelector('script[src*="MOLPay_seamless"]')) {
        console.log('MOLPay script tag exists, waiting...');
        let attempts = 0;
        const checkMOLPay = setInterval(() => {
          attempts++;
          if (window.jQuery && window.jQuery.fn && window.jQuery.fn.MOLPaySeamless) {
            clearInterval(checkMOLPay);
            setIsReady(true);
            scriptsLoadedRef.current = true;
            loadingScriptsRef.current = false;
            console.log('MOLPay Seamless plugin ready!');
          } else if (attempts > 100) {
            clearInterval(checkMOLPay);
            loadingScriptsRef.current = false;
            console.warn('MOLPay Seamless plugin still initializing after 10 seconds');
          }
        }, 100);
        return;
      }

      console.log('Loading MOLPay Seamless script...');
      const molpayScript = document.createElement('script');
      // Official Fiuu Seamless Integration v3.28 - Production
      // Documentation: https://github.com/FiuuPayment/Integration-Fiuu_JavaScript_Seamless_Integration/wiki/Fiuu-Seamless-Integration-v3.28-(non-PCI)
      // Production: 'https://pay.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js'
      // Sandbox (for testing): 'https://sandbox.merchant.razer.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js'
      molpayScript.src = 'https://pay.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js';
      molpayScript.async = false;
      molpayScript.onload = () => {
        console.log('MOLPay Seamless script loaded, waiting for plugin initialization...');
        let attempts = 0;
        const checkReady = setInterval(() => {
          attempts++;
          if (window.jQuery && window.jQuery.fn && window.jQuery.fn.MOLPaySeamless) {
            clearInterval(checkReady);
            setIsReady(true);
            scriptsLoadedRef.current = true;
            loadingScriptsRef.current = false;
            console.log('MOLPay Seamless plugin ready!');
          } else if (attempts > 100) {
            clearInterval(checkReady);
            loadingScriptsRef.current = false;
            console.warn('MOLPay Seamless plugin still initializing after 10 seconds');
          }
        }, 100);
      };
      molpayScript.onerror = (err) => {
        console.error('Failed to load MOLPay Seamless script:', err);
        loadingScriptsRef.current = false;
        setError('Failed to load payment gateway script. Please check your internet connection and refresh the page.');
      };
      document.body.appendChild(molpayScript);
    };

    loadjQuery();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = (e) => {
    // Official Fiuu demo pattern: Form has role="molpayseamless"
    // The MOLPay plugin automatically intercepts form submission when role="molpayseamless" is set
    // It will submit to action URL via AJAX, get JSON response, and process payment automatically
    
    // Validate form before allowing submission
    if (!formRef.current?.checkValidity()) {
      e.preventDefault();
      alert("Please fill in all required fields.");
      formRef.current?.reportValidity();
      const firstInvalid = formRef.current?.querySelector(':invalid');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    // Prevent multiple simultaneous submissions
    if (isProcessing) {
      e.preventDefault();
      return;
    }

    if (!window.jQuery || !window.jQuery.fn.MOLPaySeamless) {
      e.preventDefault();
      setError('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    // Set processing state - plugin will handle the rest
    setIsProcessing(true);
    setError(''); // Clear previous errors
    
    // The MOLPay plugin with role="molpayseamless" will:
    // 1. Prevent default form submission
    // 2. Submit form data to action URL (/api/payment/create-request) via AJAX
    // 3. Get JSON response with payment parameters
    // 4. Initialize payment modal automatically
    // We don't need to manually handle the submission - plugin does it all
    
    // Reset processing state after delay (plugin handles payment flow)
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">Razer Merchant Services Seamless Payment Test</h1>
            <p className="text-white/60 text-sm">Version 3.28 - Seamless Integration - Production Mode</p>
            <p className="text-yellow-400 text-xs mt-2">
              Merchant ID: {process.env.NEXT_PUBLIC_FIUU_MERCHANT_ID || 'MScinema_Dev'} | Amount: RM {formData.total_amount}
            </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Form - MOLPay plugin will intercept form submission */}
        {/* Official Fiuu demo pattern: form has role="molpayseamless" and action pointing to backend */}
        <form
          ref={formRef}
          id="paymentForm"
          role="molpayseamless"
          action="/api/payment/create-request"
          method="POST"
          onSubmit={handleFormSubmit}
          className="space-y-6"
        >
          {/* Order Summary */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Your Order</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Product:</span>
                <span className="text-white">Test Product</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Price:</span>
                <span className="text-white">RM {formData.total_amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Quantity:</span>
                <span className="text-white">1</span>
              </div>
              <div className="border-t border-[#2a2a2a] pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Order Total:</span>
                  <span className="text-xl font-bold text-[#FFCA20]">RM {formData.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Billing Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#FFCA20]"
                  name="billingFirstName"
                  value={formData.billingFirstName}
                  onChange={(e) => handleInputChange('billingFirstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#FFCA20]"
                  name="billingLastName"
                  value={formData.billingLastName}
                  onChange={(e) => handleInputChange('billingLastName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#FFCA20]"
                  name="billingMobile"
                  value={formData.billingMobile}
                  onChange={(e) => handleInputChange('billingMobile', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#FFCA20]"
                  name="billingEmail"
                  value={formData.billingEmail}
                  onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">
                  Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#FFCA20]"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Channel Selection */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div>
              <label className="block text-sm text-white/70 mb-2">
                Payment Channel (Optional)
              </label>
              <select
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#FFCA20]"
                name="payment_options"
                value={formData.paymentChannel}
                onChange={(e) => handleInputChange('paymentChannel', e.target.value)}
              >
                <option value="">Show All Payment Methods (Recommended)</option>
                <optgroup label="FPX Online Banking (MYR)">
                  <option value="fpx">MyClear FPX B2C (All Banks)</option>
                  <option value="fpx_mb2u">FPX Maybank (Maybank2u)</option>
                  <option value="fpx_cimbclicks">FPX CIMB Clicks</option>
                  <option value="fpx_hlb">FPX Hong Leong Bank</option>
                  <option value="fpx_pbb">FPX Public Bank</option>
                  <option value="fpx_rhb">FPX RHB Bank</option>
                  <option value="fpx_bimb">FPX Bank Islam</option>
                  <option value="fpx_ocbc">FPX OCBC Bank</option>
                  <option value="fpx_uob">FPX UOB</option>
                </optgroup>
                <optgroup label="Credit/Debit Cards">
                  <option value="creditAN">Credit Card (MYR, SGD)</option>
                  <option value="credit">Credit Card (MYR)</option>
                  <option value="credit5">Credit Card (MYR)</option>
                  <option value="credit18">Credit Card (MYR)</option>
                </optgroup>
                <optgroup label="e-Wallets (MYR)">
                  <option value="GrabPay">GrabPay</option>
                  <option value="TNG-EWALLET">Touch 'N Go e-Wallet</option>
                  <option value="BOOST">Boost e-Wallet</option>
                  <option value="ShopeePay">ShopeePay</option>
                  <option value="RPP_DuitNowQR">DuitNow QR</option>
                  <option value="AlipayPlus">Alipay+</option>
                </optgroup>
              </select>
              <p className="text-xs text-white/50 mt-2">
                <strong>Note:</strong> "maybank2u" is deprecated (removed 2025/03/12). Use "fpx_mb2u" for FPX Maybank. Leave empty to show all available payment methods.
              </p>
            </div>
          </div>

          {/* Payment Button */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Payment</h2>
            <p className="text-sm text-white/60 mb-4">
              <strong className="text-[#FFCA20]">Secure Online Payment by Razer Merchant Services</strong>
            </p>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-300 mb-2">
                <strong>How it works:</strong>
              </p>
              <ul className="text-xs text-blue-200/80 space-y-1 list-disc list-inside">
                <li>Select a payment channel above (or leave empty to see all options)</li>
                <li>Click "Proceed to Payment" below</li>
                <li>The payment modal will open with your selected payment method (or all methods if none selected)</li>
                <li>Complete the payment securely</li>
              </ul>
            </div>

            <button
              id="payButton"
              type="submit"
              disabled={!isReady || isProcessing}
              className={`w-full px-8 py-3 rounded-lg font-medium transition ${
                isReady && !isProcessing
                  ? 'bg-[#FFCA20] text-black hover:bg-[#FFCA20]/90' 
                  : 'bg-[#FFCA20]/30 text-black/50 cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Processing...' : isReady ? 'Proceed to Payment' : 'Loading Payment Gateway...'}
            </button>
          </div>

          {/* Hidden Fields - Sent to API to generate payment parameters */}
          <input type="hidden" name="currency" value={formData.currency} />
          <input type="hidden" name="total_amount" value={formData.total_amount} />
          <input type="hidden" name="molpaytimer" value={formData.molpaytimer} />
          <input type="hidden" name="molpaytimerbox" value={formData.molpaytimerbox} />
          <input type="hidden" name="returnUrl" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/molpay_return`} />
          <input type="hidden" name="cancelUrl" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/payment/failed`} />
        </form>

        {/* Timer Container */}
        <div id="counter" className="mt-4"></div>

        {/* Script Loading Status */}
        <div className="mt-6 p-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded">
          <h3 className="text-sm font-semibold text-white mb-3">Payment Gateway Status:</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={isReady ? 'text-green-400' : 'text-yellow-400'}>
                {isReady ? '✓' : '○'}
              </span>
              <span className={isReady ? 'text-green-400' : 'text-yellow-400'}>
                {isReady ? 'Payment Gateway Ready' : 'Loading Payment Gateway...'}
              </span>
            </div>
            <div className="text-white/60 text-xs">
              {isReady 
                ? 'Select a payment method above to proceed'
                : 'Please wait while the payment gateway loads'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
