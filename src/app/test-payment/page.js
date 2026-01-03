"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function TestPaymentPage() {
  const router = useRouter();
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    billingFirstName: 'Test',
    billingLastName: 'User',
    billingEmail: 'test@example.com',
    billingMobile: '0123456789',
    billingAddress: 'Test Address',
    currency: 'MYR',
    total_amount: '1.01',
    molpaytimer: '3',
    molpaytimerbox: '#counter',
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
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
      jQueryScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js';
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
      // Use sandbox for testing, production for live
      // Update this URL when switching to production:
      // Production: 'https://www.onlinepayment.com.my/MOLPay/API/seamless/3.28/js/MOLPay_seamless.deco.js'
      // Sandbox: 'https://sandbox.merchant.razer.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js'
      molpayScript.src = 'https://sandbox.merchant.razer.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js';
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
    // Don't prevent default - let MOLPay plugin intercept the form submission
    if (!window.jQuery || !window.jQuery.fn.MOLPaySeamless) {
      e.preventDefault();
      setError('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    // Validate form before submitting
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

    console.log('Form submitting - MOLPay plugin will intercept and show all available payment methods');
    // Don't prevent default - let the plugin handle it
    // The plugin will:
    // 1. Submit form to /api/payment/create-request
    // 2. Get payment parameters
    // 3. Show modal with ALL available payment methods from Razer Merchant Services
    // 4. User selects their preferred payment method
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Razer Merchant Services Seamless Payment Test</h1>
          <p className="text-white/60 text-sm">Version 3.28 - Seamless Integration - Sandbox Mode</p>
          <p className="text-yellow-400 text-xs mt-2">
            Merchant ID: MScinema_Dev | Amount: RM {formData.total_amount}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Form with role="molpayseamless" - This is key for MOLPay plugin */}
        <form
          ref={formRef}
          method="POST"
          action="/api/payment/create-request"
          role="molpayseamless"
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
                <span className="text-white">{formData.currency} {formData.total_amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Quantity:</span>
                <span className="text-white">1</span>
              </div>
              <div className="border-t border-[#2a2a2a] pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Order Total:</span>
                  <span className="text-xl font-bold text-[#FFCA20]">{formData.currency} {formData.total_amount}</span>
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
                <li>Click "Proceed to Payment" below</li>
                <li>The payment modal will open showing ALL payment methods enabled in your Razer Merchant Services account</li>
                <li>Select your preferred payment method (Credit Card, FPX, eWallets, etc.)</li>
                <li>Complete the payment securely</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={!isReady}
              className={`w-full px-8 py-3 rounded-lg font-medium transition ${
                isReady
                  ? 'bg-[#FFCA20] text-black hover:bg-[#FFCA20]/90' 
                  : 'bg-[#FFCA20]/30 text-black/50 cursor-not-allowed'
              }`}
            >
              {isReady ? 'Proceed to Payment' : 'Loading Payment Gateway...'}
            </button>
          </div>

          {/* Hidden Fields - Required for MOLPay plugin */}
          {/* Note: payment_options is optional for seamless - plugin will show all available methods */}
          <input type="hidden" name="payment_options" value="credit" />
          <input type="hidden" name="currency" value={formData.currency} />
          <input type="hidden" name="total_amount" value={formData.total_amount} />
          <input type="hidden" name="molpaytimer" value={formData.molpaytimer} />
          <input type="hidden" name="molpaytimerbox" value={formData.molpaytimerbox} />
          <input type="hidden" name="returnUrl" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/payment/return`} />
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
