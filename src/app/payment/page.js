"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Clock } from 'lucide-react';
import { booking } from '@/services/api';
import { encryptId, decryptId, encryptIds, decryptIds } from '@/utils/encryption';

export default function PaymentPage() {
  const router = useRouter();
  const formRef = useRef(null);
  
  const [bookingData, setBookingData] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const scriptsLoadedRef = useRef(false);
  const loadingScriptsRef = useRef(false);

  // Payment methods configuration - Only show specified payment methods
  // Using images from public/images folder
  const paymentMethods = [
    // E-wallets
    { channel: 'WeChatPayMY', name: 'WeChat Pay', image: '/images/wechatpay.png' },
    { channel: 'alipay', name: 'Alipay', image: '/images/alipay.png' },
    
    // FPX Online Banking
    { channel: 'fpx_abmb', name: 'Alliance Bank', image: '/images/payment-affin.jpg' },
    { channel: 'fpx_bimb', name: 'Bank Islam', image: '/images/payment-bank-islam.jpg' },
    { channel: 'fpx_abb', name: 'Affin Bank', image: '/images/payment-affin.jpg' },
    { channel: 'fpx_pbb', name: 'Public Bank', image: '/images/payment-pbe.jpg' },
    { channel: 'fpx_amb', name: 'AmBank', image: '/images/payment-amonline.jpg' },
    { channel: 'fpx_rhb', name: 'RHB', image: '/images/payment-rhb.jpg' },
    { channel: 'fpx_hlb', name: 'Hong Leong Bank', image: '/images/payment-hlb.jpg' },
    { channel: 'fpx_cimbclicks', name: 'CIMB Bank', image: '/images/payment-cimb.jpg' },
    { channel: 'fpx_mb2u', name: 'MayBank', image: '/images/payment-m2u.jpg' },
    
    // Credit/Debit Cards
    { channel: 'creditAN', name: 'Visa', image: '/images/payment-credit.jpg', tcctype: 'SALS' },
    
    // E-wallets (continued)
    { channel: 'BOOST', name: 'Boost', image: '/images/boost.png' }, // Using credit card as placeholder until Boost image is added
    { channel: 'GrabPay', name: 'GrabPay', image: '/images/grabpay.webp' },
    { channel: 'TNG-EWALLET', name: 'Touch \'n Go eWallet', image: '/images/touchngopay.png' },
    { channel: 'ShopeePay', name: 'Shopee Pay', image: '/images/shopeepay.png' },
    { channel: 'MB2U_QRPay-Push', name: 'MayBank QR Pay', image: '/images/maypayqrpay.png' },
  ];

  // Load booking data from localStorage and initialize timer
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bookingData');
      if (stored) {
        const data = JSON.parse(stored);
        setBookingData(data);
        
        // Initialize timer from localStorage - calculate remaining time based on lock time
        const timerStartTime = localStorage.getItem('timerStartTime');
        const timerDuration = 120; // 2 minutes in seconds
        
        if (timerStartTime) {
          const lockTime = parseInt(timerStartTime);
          const now = Date.now();
          const elapsed = Math.floor((now - lockTime) / 1000);
          const remaining = Math.max(0, timerDuration - elapsed);
          
          if (remaining <= 0) {
            // Timer expired - release seats and redirect
            releaseConfirmedSeats();
            return;
          }
          
          setTimeLeft(remaining);
          setTimerActive(true);
        } else {
          // No timer found - might be expired, redirect to seat selection
          setError('Booking session expired. Please select seats again.');
          setTimeout(() => {
            const encrypted = encryptIds({ cinemaId: data.cinemaId || '', showId: data.showId || '', movieId: data.movieId || '' });
            router.push(`/seat-selection?cinemaId=${encrypted.cinemaId}&showId=${encrypted.showId}&movieId=${encrypted.movieId}`);
          }, 2000);
        }
        
        setIsLoading(false);
      } else {
        setError('No booking data found. Please start a new booking.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading booking data:', err);
      setError('Failed to load booking data. Please start a new booking.');
      setIsLoading(false);
    }
  }, []);

  // Timer countdown effect for payment page
  useEffect(() => {
    if (!timerActive || !bookingData || timeLeft <= 0) {
      if (timeLeft <= 0 && bookingData) {
        // Timer expired
        releaseConfirmedSeats();
      }
      return;
    }
    
    const interval = setInterval(() => {
      setTimeLeft(time => {
        const newTime = time - 1;
        if (newTime <= 0) {
          setTimerActive(false);
          // Timer expired - release seats and redirect
          releaseConfirmedSeats();
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [timerActive, timeLeft, bookingData]);

  const releaseConfirmedSeats = async () => {
    if (!bookingData) return;
    
    const referenceNo = bookingData.confirmedReferenceNo || bookingData.referenceNo;
    const cinemaId = bookingData.cinemaId;
    const showId = bookingData.showId;
    const movieId = bookingData.movieId;
    
    // Clear booking data first
    localStorage.removeItem('bookingData');
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('timerDuration');
    localStorage.removeItem('confirmedReferenceNo');
    localStorage.removeItem('lockTime');
    
    if (!referenceNo || !cinemaId || !showId) {
      // No reference - just redirect to seat selection
      const encrypted = encryptIds({ cinemaId: cinemaId || '', showId: showId || '', movieId: movieId || '' });
      window.location.href = `/seat-selection?cinemaId=${encrypted.cinemaId}&showId=${encrypted.showId}&movieId=${encrypted.movieId}`;
      return;
    }
    
    try {
      if (bookingData.confirmedReferenceNo) {
        // Use ReleaseConfirmedLockedSeats if confirmed
        await booking.releaseConfirmedLockedSeats(cinemaId, showId, referenceNo);
      } else {
        // Use ReleaseLockedSeats if only locked
        await booking.releaseLockedSeats(cinemaId, showId, referenceNo, 0);
      }
    } catch (err) {
      console.error('Error releasing seats:', err);
    } finally {
      // Always redirect to seat selection page after releasing (reload page)
      const encrypted = encryptIds({ cinemaId: cinemaId || '', showId: showId || '', movieId: movieId || '' });
      window.location.href = `/seat-selection?cinemaId=${encrypted.cinemaId}&showId=${encrypted.showId}&movieId=${encrypted.movieId}`;
    }
  };

  // Load jQuery and MOLPay Seamless scripts
  useEffect(() => {
    if (typeof window === 'undefined' || scriptsLoadedRef.current || loadingScriptsRef.current || isLoading) {
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
      // Use production script URL (same as test-payment which is working)
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
  }, [isLoading]);

  // Handle payment method button click
  const handlePaymentClick = (method, e) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      alert('Please indicate that you have read and agree to the Terms and Conditions and Privacy Policy');
      return false;
    }

    if (!isReady) {
      setError('Payment gateway is still loading. Please wait a moment and try again.');
      return false;
    }

    if (!bookingData) {
      setError('Booking data not found. Please start a new booking.');
      return false;
    }

    // Get billing information from booking data
    const nameParts = (bookingData.formData?.name || '').split(' ');
    const billingFirstName = nameParts[0] || '';
    const billingLastName = nameParts.slice(1).join(' ') || '';
    const billName = `${billingFirstName} ${billingLastName}`.trim() || 'Customer';
    const billEmail = bookingData.formData?.email || '';
    const billMobile = bookingData.formData?.mobile || '';
    const billDesc = `Movie Ticket Booking - ${bookingData.seats?.join(', ') || 'N/A'}`;
    const amount = bookingData.priceInfo?.totalTicketPrice || '0.00';
    const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/return`;
    const cancelUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/failed`;

    // Create form data for API call
    const formDataToSend = new FormData();
    formDataToSend.append('billingFirstName', billingFirstName);
    formDataToSend.append('billingLastName', billingLastName);
    formDataToSend.append('billingEmail', billEmail);
    formDataToSend.append('billingMobile', billMobile);
    formDataToSend.append('billingAddress', 'Movie Ticket Booking');
    formDataToSend.append('currency', 'MYR');
    formDataToSend.append('total_amount', amount);
    formDataToSend.append('payment_options', method.channel);
    formDataToSend.append('referenceNo', bookingData.confirmedReferenceNo || bookingData.referenceNo || '');
    formDataToSend.append('cinemaId', bookingData.cinemaId || '');
    formDataToSend.append('showId', bookingData.showId || '');
    formDataToSend.append('membershipId', '0'); // Default membership ID
    formDataToSend.append('returnUrl', returnUrl);
    formDataToSend.append('cancelUrl', cancelUrl);
    formDataToSend.append('notifyUrl', `${typeof window !== 'undefined' ? window.location.origin : ''}/api/payment/notify`);

    // Get auth token from localStorage to support API calls during callback
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ms_cinema_token') || localStorage.getItem('ms_cinema_public_token');
      if (token) {
        formDataToSend.append('token', token);
      }
    }

    // Don't set isProcessing to true here - allow multiple clicks
    setError('');

    // Call API to get payment parameters FIRST to ensure we have the correct Order ID
    fetch('/api/payment/create-request', {
      method: 'POST',
      body: formDataToSend,
    })
      .then(response => response.json())
      .then(data => {
        if (!data.status) {
          throw new Error(data.error_desc || data.error || 'Failed to create payment request');
        }

        // Create Order in Database using the ID returned from payment gateway
        const orderData = {
            orderId: data.mpsorderid, // Payment Gateway Order ID
            referenceNo: bookingData.confirmedReferenceNo || bookingData.referenceNo, // Ticket Reference
            transactionNo: null,
            customerName: billName,
            customerEmail: billEmail,
            customerPhone: billMobile,
            movieTitle: movieTitle,
            movieId: bookingData.movieId,
            cinemaName: cinemaName,
            cinemaId: bookingData.cinemaId,
            hallName: hallName,
            showId: bookingData.showId,
            showTime: bookingData.showTimeDetails?.showTime,
            seats: bookingData.seats,
            ticketType: bookingData.ticketType || 'Standard',
            totalAmount: bookingData.priceInfo?.totalTicketPrice || '0.00',
            paymentStatus: 'PENDING',
            paymentMethod: method.name
        };

        return fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        }).then(res => res.json())
          .then(orderRes => {
              console.log('Order created with ID:', data.mpsorderid);
              // Pass data to next then block
              return data;
          });
      })
      .then(data => {
        // Initialize payment with MOLPay Seamless plugin immediately
        if (window.jQuery && window.jQuery.fn && window.jQuery.fn.MOLPaySeamless) {
          const $ = window.jQuery;
          
          // Build payment parameters object
          const paymentParams = {
            mpsmerchantid: data.mpsmerchantid,
            mpsamount: data.mpsamount,
            mpsorderid: data.mpsorderid,
            mpsbill_name: data.mpsbill_name,
            mpsbill_email: data.mpsbill_email,
            mpsbill_mobile: data.mpsbill_mobile,
            mpsbill_desc: data.mpsbill_desc,
            mpscountry: data.mpscountry,
            mpscurrency: data.mpscurrency,
            mpschannel: data.mpschannel,
            mpsvcode: data.mpsvcode,
            mpsreturnurl: data.mpsreturnurl,
            mpscancelurl: data.mpscancelurl,
            mpswaittime: '294',
          };

          if (method.tcctype) {
            paymentParams.mpstcctype = method.tcctype;
          }

          // Create a button element with all data-mps* attributes (WordPress pattern)
          // The MOLPay plugin automatically handles buttons with data-toggle="molpayseamless"
          const tempButtonId = `molpay_btn_${method.channel}_${Date.now()}`;
          const tempButton = document.createElement('button');
          tempButton.id = tempButtonId;
          tempButton.type = 'button';
          tempButton.style.display = 'none';
          tempButton.setAttribute('data-toggle', 'molpayseamless');
          tempButton.setAttribute('data-mpsmerchantid', paymentParams.mpsmerchantid);
          tempButton.setAttribute('data-mpsamount', paymentParams.mpsamount);
          tempButton.setAttribute('data-mpsorderid', paymentParams.mpsorderid);
          tempButton.setAttribute('data-mpsbill_name', paymentParams.mpsbill_name);
          tempButton.setAttribute('data-mpsbill_email', paymentParams.mpsbill_email);
          tempButton.setAttribute('data-mpsbill_mobile', paymentParams.mpsbill_mobile);
          tempButton.setAttribute('data-mpsbill_desc', paymentParams.mpsbill_desc);
          tempButton.setAttribute('data-mpscountry', paymentParams.mpscountry);
          tempButton.setAttribute('data-mpscurrency', paymentParams.mpscurrency);
          tempButton.setAttribute('data-mpschannel', paymentParams.mpschannel);
          tempButton.setAttribute('data-mpsvcode', paymentParams.mpsvcode);
          tempButton.setAttribute('data-mpsreturnurl', paymentParams.mpsreturnurl);
          tempButton.setAttribute('data-mpscancelurl', paymentParams.mpscancelurl);
          tempButton.setAttribute('data-mpswaittime', paymentParams.mpswaittime);
          
          if (method.tcctype) {
            tempButton.setAttribute('data-mpstcctype', method.tcctype);
          }
          
          // Append to body
          document.body.appendChild(tempButton);
          
          // Initialize MOLPay Seamless on the button using jQuery
          // This will automatically open the payment modal when button is clicked
          $(tempButton).MOLPaySeamless();
          
          // Trigger click to open payment modal immediately
          setTimeout(() => {
            $(tempButton).trigger('click');
          }, 150);
        } else {
          throw new Error('Payment gateway plugin not ready');
        }
      })
      .catch(err => {
        console.error('Payment error:', err);
        setError(err.message || 'Failed to initialize payment. Please try again.');
      });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading booking data...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">{error || 'No booking data found.'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-[#FFCA20] text-black rounded-lg hover:bg-[#FFCA20]/90"
            >
              Start New Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get movie details
  const movieTitle = bookingData.movieDetails?.movieName || bookingData.movieDetails?.title || 'Movie Title';
  const movieImage = bookingData.movieDetails?.imageURL || bookingData.movieDetails?.image || 'img/banner.jpg';
  const movieGenre = bookingData.movieDetails?.genre || 'N/A';
  const movieDuration = bookingData.movieDetails?.duration || 'N/A';
  const movieLanguage = bookingData.movieDetails?.language || 'N/A';
  const cinemaName = bookingData.cinemaDetails?.displayName || bookingData.cinemaDetails?.name || 'Cinema';
  const experienceType = bookingData.movieDetails?.type || '2D';
  const hallName = bookingData.showTimeDetails?.hallName || 'HALL - 1';
  let showDateTime = 'N/A';
  if (bookingData.showTimeDetails?.showTime) {
    try {
      const date = new Date(bookingData.showTimeDetails.showTime);
      const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      showDateTime = `${dateStr}, ${timeStr}`;
    } catch (e) {
      showDateTime = bookingData.showTimeDetails.showTime;
    }
  }

  const nameParts = (bookingData.formData?.name || '').split(' ');
  const billingFirstName = nameParts[0] || '';
  const billingLastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#2a2a2a] rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Complete Payment</h1>
              <p className="text-white/60 text-sm">Secure payment by Razer Merchant Services</p>
            </div>
          </div>
          {/* Timer Display */}
          {timerActive && timeLeft > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-sm font-mono text-red-400 font-semibold">
                Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Booking Summary */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Booking Summary</h2>
          
          <div className="space-y-4">
            {/* Movie Info with Image */}
            <div className="flex gap-4 pb-4 border-b border-[#2a2a2a]">
              <img
                src={movieImage}
                alt={movieTitle}
                className="w-20 h-32 object-cover rounded"
                onError={(e) => {
                  e.target.src = 'img/banner.jpg';
                }}
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">{movieTitle}</h3>
                <div className="space-y-1 text-xs text-white/70">
                  <p>{movieGenre}</p>
                  <p>{movieDuration}</p>
                  <p>{movieLanguage}</p>
                </div>
              </div>
            </div>
            
            {/* Booking Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Cinema:</span>
                <span className="text-white font-medium">{cinemaName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Experience:</span>
                <span className="text-white font-medium">{experienceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Hall:</span>
                <span className="text-white font-medium">{hallName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Show Time:</span>
                <span className="text-white font-medium">{showDateTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Seats:</span>
                <span className="text-white font-medium">{bookingData.seats?.sort().join(', ') || 'N/A'}</span>
              </div>
            </div>
            
            {/* Price Summary */}
            <div className="border-t border-[#2a2a2a] pt-4 mt-4">
              {bookingData.priceInfo && (
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between text-white/70">
                    <span>Net Price:</span>
                    <span className="text-white">RM {bookingData.priceInfo.netPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  {bookingData.priceInfo.entertainmentTax > 0 && (
                    <div className="flex justify-between text-white/70">
                      <span>Entertainment Tax:</span>
                      <span className="text-white">RM {bookingData.priceInfo.entertainmentTax?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {bookingData.priceInfo.govtTax > 0 && (
                    <div className="flex justify-between text-white/70">
                      <span>Government Tax:</span>
                      <span className="text-white">RM {bookingData.priceInfo.govtTax?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {bookingData.priceInfo.onlineCharge > 0 && (
                    <div className="flex justify-between text-white/70">
                      <span>Online Charge:</span>
                      <span className="text-white">RM {bookingData.priceInfo.onlineCharge?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-[#2a2a2a]">
                <span className="text-lg font-semibold text-white">Total Amount:</span>
                <span className="text-xl font-bold text-[#FFCA20]">
                  RM {parseFloat(bookingData.priceInfo?.totalTicketPrice || '0.00').toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form - WordPress Style */}
        <form
          ref={formRef}
          id="molpay_payment_form"
          name="molpay_payment_form"
          onSubmit={(e) => {
            e.preventDefault();
            return false;
          }}
        >
          {/* Hidden Fields - Billing information from booking data */}
          <input type="hidden" name="billingFirstName" value={billingFirstName} />
          <input type="hidden" name="billingLastName" value={billingLastName} />
          <input type="hidden" name="billingEmail" value={bookingData.formData?.email || ''} />
          <input type="hidden" name="billingMobile" value={bookingData.formData?.mobile || ''} />
          <input type="hidden" name="billingAddress" value="Movie Ticket Booking" />
          <input type="hidden" name="currency" value="MYR" />
          <input type="hidden" name="total_amount" value={bookingData.priceInfo?.totalTicketPrice || '0.00'} />
          <input type="hidden" name="referenceNo" value={bookingData.confirmedReferenceNo || bookingData.referenceNo || ''} />
          <input type="hidden" name="returnUrl" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/payment/return`} />
          <input type="hidden" name="cancelUrl" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/payment/failed`} />
          <input type="hidden" name="notifyUrl" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/payment/notify`} />

          {/* Pay Via Section */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              <u>Pay via</u>:
            </h3>
            
            {/* Razer Merchant Services Logo */}
            <div className="mb-4">
              <img
                src="/images/razerms_logo.png"
                alt="Razer Merchant Services"
                width="200"
                height="auto"
                className="max-w-[200px]"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="checkbox"
                  value="check"
                  id="agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#FFCA20] bg-[#2a2a2a] border-[#3a3a3a] rounded focus:ring-[#FFCA20]"
                />
                <span className="text-sm text-white/80">
                  I have read and agree to the{' '}
                  <b>
                    <a
                      href="https://merchant.razer.com/v3/terms-of-service/"
                      target="_blank"
                      rel="noopener"
                      className="text-[#FFCA20] hover:underline"
                    >
                      Terms & Conditions
                    </a>
                  </b>{' '}
                  and{' '}
                  <b>
                    <a
                      href="https://merchant.razer.com/v3/privacy-policy/"
                      target="_blank"
                      rel="noopener"
                      className="text-[#FFCA20] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </b>
                  .
                </span>
              </label>
            </div>

            {/* Payment Method Icons */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.channel}
                  type="button"
                  onClick={(e) => handlePaymentClick(method, e)}
                  disabled={!isReady || !agreedToTerms}
                  className={`group relative flex flex-col items-center justify-center w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                    !isReady || !agreedToTerms
                      ? 'opacity-50 cursor-not-allowed border-[#3a3a3a] bg-[#2a2a2a]'
                      : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-[#FFCA20] hover:bg-[#2a2a2a]/80 cursor-pointer'
                  }`}
                >
                  <div className="w-full h-16 flex items-center justify-center mb-2">
                    <img
                      src={method.image}
                      alt={method.name}
                      className={`max-w-full max-h-full object-contain ${
                        method.channel.startsWith('fpx_') || method.channel === 'fpx'
                          ? 'p-1'
                          : ''
                      }`}
                      style={{
                        width: 'auto',
                        height: 'auto',
                        maxWidth: '100%',
                        maxHeight: '64px'
                      }}
                      onError={(e) => {
                        // Only fallback to credit card if image fails to load
                        console.warn(`[Payment] Image failed to load: ${method.image} for ${method.name}`);
                        if (!e.target.src.includes('payment-credit.jpg')) {
                          e.target.src = '/images/payment-credit.jpg';
                        }
                      }}
                    />
                  </div>
                  {/* Show label for all payment methods */}
                  <span className="text-xs text-white/80 text-center leading-tight font-medium group-hover:text-[#FFCA20] transition-colors">
                    {method.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Script Loading Status */}
        {!isReady && (
          <div className="mt-6 p-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
              <span className="text-yellow-400 text-sm">Loading Payment Gateway...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
