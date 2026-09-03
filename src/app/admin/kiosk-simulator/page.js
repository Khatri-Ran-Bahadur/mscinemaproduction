"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Monitor,
  Play,
  QrCode,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Printer,
  Film,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Terminal,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export default function KioskSimulatorPage() {
  // Simulator State
  const [step, setStep] = useState(1); // 1: Selection, 2: Payment, 3: Ticket
  const [selectedMovie, setSelectedMovie] = useState("Jawan");
  const [cinemaName, setCinemaName] = useState("MS Cinemas Klang");
  const [hallName, setHallName] = useState("Hall 2");
  const [selectedSeats, setSelectedSeats] = useState(["E12", "E13"]);
  const [ticketPrice] = useState(15.0);
  const [paymentMethod, setPaymentMethod] = useState("FIUU_QR"); // FIUU_QR or CARDBIZ_EDC

  // Live Transaction State
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [isPolling, setIsPolling] = useState(false);
  const [logs, setLogs] = useState([]);

  // Refs for timers
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  const addLog = (title, data, type = "info") => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [
      { id: Date.now() + Math.random(), timestamp, title, data, type },
      ...prev.slice(0, 19),
    ]);
  };

  const totalAmount = selectedSeats.length * ticketPrice;

  // 1. Create Kiosk Order
  const handleInitiateOrder = async () => {
    setLoading(true);
    const mockRef = "KSK" + Date.now().toString().slice(-6);
    addLog("Initiating Kiosk Order", { referenceNo: mockRef, amount: totalAmount }, "info");

    try {
      const res = await fetch("/api/kiosk/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNo: mockRef,
          amount: totalAmount,
          movieTitle: selectedMovie,
          cinemaName: cinemaName,
          cinemaId: "1",
          hallName: hallName,
          showId: "3542",
          showTime: "2026-09-03 20:30:00",
          seats: selectedSeats,
          ticketType: "Adult",
          customerName: "Kiosk Walk-in",
          customerPhone: "0123456789",
          customerEmail: "kiosk.test@mscinemas.my",
          terminalId: "KIOSK01",
          paymentMethod: paymentMethod,
        }),
      });

      const data = await res.json();
      addLog("Order Create Response", data, data.success ? "success" : "error");

      if (data.success) {
        setOrderData(data);
        setStep(2);
        setCountdown(120);
        startPolling(data.orderId, data.referenceNo);
      } else {
        alert(data.error || "Failed to create kiosk order");
      }
    } catch (err) {
      addLog("Network Error", err.message, "error");
      alert("Error initiating order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Start Polling Loop
  const startPolling = (orderId, referenceNo) => {
    stopPolling();
    setIsPolling(true);

    // Countdown Timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleCancelOrder(orderId, referenceNo, "Timer expired (Timeout)");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2-Second Polling Timer
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/kiosk/orders/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, referenceNo }),
        });
        const data = await res.json();

        if (data.status === "PAID") {
          addLog("Payment Confirmed! Polling Stopped", data, "success");
          stopPolling();
          setTicketData(data.ticketData);
          setStep(3);
        } else if (data.status === "CANCELLED" || data.status === "FAILED") {
          addLog("Order Terminated", data, "error");
          stopPolling();
          alert("Order was cancelled or payment failed.");
          resetSimulator();
        }
      } catch (err) {
        console.warn("Polling error:", err.message);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsPolling(false);
  };

  // 3. Simulate QR Payment Success
  const handleSimulateQrSuccess = async () => {
    if (!orderData) return;
    addLog("Simulating Customer Scanned & Paid QR", { orderId: orderData.orderId }, "warning");

    try {
      const res = await fetch("/api/kiosk/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          referenceNo: orderData.referenceNo,
          simulateQrSuccess: true,
        }),
      });
      const data = await res.json();
      addLog("Simulated QR Status Result", data, data.success ? "success" : "error");

      if (data.status === "PAID") {
        stopPolling();
        setTicketData(data.ticketData);
        setStep(3);
      }
    } catch (err) {
      addLog("Simulate Error", err.message, "error");
    }
  };

  // 4. Simulate CardBiz EDC Card Tap
  const handleSimulateCardSuccess = async () => {
    if (!orderData) return;
    const cardApproval = {
      statusCode: 0,
      responseCode: "00",
      statusMessage: "APPROVED",
      approvalCode: "882194",
      traceNo: Date.now().toString().slice(-6),
      invoiceNo: "000109",
      cardNo: "411111******1111",
      cardLabel: "VISA CREDIT",
    };

    addLog("Simulating CardBiz UPT1000 Tap Approval", cardApproval, "warning");

    try {
      const res = await fetch("/api/kiosk/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          referenceNo: orderData.referenceNo,
          cardPaymentResult: cardApproval,
        }),
      });
      const data = await res.json();
      addLog("CardBiz EDC Status Result", data, data.success ? "success" : "error");

      if (data.status === "PAID") {
        stopPolling();
        setTicketData(data.ticketData);
        setStep(3);
      }
    } catch (err) {
      addLog("Card Simulate Error", err.message, "error");
    }
  };

  // 5. Cancel Order
  const handleCancelOrder = async (
    orderId = orderData?.orderId,
    referenceNo = orderData?.referenceNo,
    reason = "Customer cancelled"
  ) => {
    stopPolling();
    addLog("Cancelling Order & Releasing Seats", { orderId, reason }, "warning");

    try {
      const res = await fetch("/api/kiosk/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          referenceNo,
          cinemaId: "1",
          showId: "3542",
        }),
      });
      const data = await res.json();
      addLog("Cancel Result", data, "info");
      alert(`Order cancelled: ${reason}`);
      resetSimulator();
    } catch (err) {
      addLog("Cancel Error", err.message, "error");
      resetSimulator();
    }
  };

  const resetSimulator = () => {
    stopPolling();
    setStep(1);
    setOrderData(null);
    setTicketData(null);
    setCountdown(120);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const toggleSeat = (seat) => {
    if (selectedSeats.includes(seat)) {
      if (selectedSeats.length > 1) {
        setSelectedSeats(selectedSeats.filter((s) => s !== seat));
      }
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#FFCA20]">
              Kiosk Simulator & Tester
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Live Sandbox Active
            </span>
          </div>
          <p className="text-[#888] mt-1 text-sm">
            Test the entire Kiosk booking, Fiuu QR generation, EDC card payment, and thermal printing without hardware
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/kiosk-orders"
            className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#3a3a3a] text-[#ccc] rounded-lg text-xs transition"
          >
            <Monitor className="w-3.5 h-3.5 text-[#FFCA20]" />
            <span>Kiosk Orders</span>
            <ExternalLink className="w-3 h-3 text-[#666]" />
          </Link>

          <Link
            href="/admin/payment-logs"
            className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#3a3a3a] text-[#ccc] rounded-lg text-xs transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Payment Logs</span>
            <ExternalLink className="w-3 h-3 text-[#666]" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Virtual Screen on Left, Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Virtual Kiosk Device Screen */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[480px] bg-[#141414] border-8 border-[#222] rounded-[36px] shadow-2xl overflow-hidden relative flex flex-col min-h-[720px]">
            {/* Kiosk Bezel Header */}
            <div className="bg-[#1e1e1e] px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center text-xs text-[#888]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-semibold text-white">MS CINEMAS KIOSK #01</span>
              </div>
              <span className="font-mono text-[10px]">KLANG TERMINAL</span>
            </div>

            {/* SCREEN CONTENT AREA */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              {/* STEP 1: MOVIE & SEAT SELECTION */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-white">Select Your Movie & Seats</h2>
                    <p className="text-xs text-[#888]">Touch screen to choose options</p>
                  </div>

                  {/* Movie Card */}
                  <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-[#333] flex items-center gap-4">
                    <div className="w-14 h-20 bg-gradient-to-br from-amber-600 to-amber-900 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      <Film className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white">{selectedMovie}</h3>
                      <p className="text-xs text-[#888]">{cinemaName} • {hallName}</p>
                      <p className="text-xs text-[#FFCA20] mt-1 font-semibold">Today, 08:30 PM (2D)</p>
                    </div>
                  </div>

                  {/* Interactive Seat Map Demo */}
                  <div>
                    <label className="block text-xs font-semibold text-[#888] uppercase mb-2">
                      Screen Area (Select Seats)
                    </label>
                    <div className="w-full h-1.5 bg-[#FFCA20] rounded-full mb-4 shadow-sm shadow-[#FFCA20]/40"></div>
                    <div className="grid grid-cols-6 gap-2 bg-[#1a1a1a] p-3 rounded-xl border border-[#2e2e2e]">
                      {["E10", "E11", "E12", "E13", "E14", "E15"].map((seat) => {
                        const isSelected = selectedSeats.includes(seat);
                        return (
                          <button
                            key={seat}
                            onClick={() => toggleSeat(seat)}
                            className={`py-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center ${
                              isSelected
                                ? "bg-[#FFCA20] text-black shadow-lg shadow-[#FFCA20]/30"
                                : "bg-[#282828] text-white hover:bg-[#333]"
                            }`}
                          >
                            <span>{seat}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-[#666] text-center mt-2">
                      Selected: <span className="text-[#FFCA20] font-semibold">{selectedSeats.join(", ")}</span> ({selectedSeats.length} seats)
                    </p>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#888] uppercase mb-2">
                      Choose Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod("FIUU_QR")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                          paymentMethod === "FIUU_QR"
                            ? "bg-[#FFCA20]/10 border-[#FFCA20] text-[#FFCA20]"
                            : "bg-[#1e1e1e] border-[#333] text-[#888] hover:border-[#444]"
                        }`}
                      >
                        <QrCode className="w-6 h-6" />
                        <span className="text-xs font-bold">Fiuu Dynamic QR</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod("CARDBIZ_EDC")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                          paymentMethod === "CARDBIZ_EDC"
                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                            : "bg-[#1e1e1e] border-[#333] text-[#888] hover:border-[#444]"
                        }`}
                      >
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs font-bold">Credit/Debit Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Total & Action */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-[#888]">Total Payable</span>
                      <span className="text-2xl font-extrabold text-[#FFCA20]">
                        RM {totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={handleInitiateOrder}
                      disabled={loading}
                      className="w-full py-4 bg-[#FFCA20] hover:bg-[#e5b51d] text-black font-extrabold rounded-2xl shadow-xl shadow-[#FFCA20]/20 flex items-center justify-center gap-2 transition text-base disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Proceed to Pay</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PAYMENT SCREEN (DYNAMIC QR OR CARD) */}
              {step === 2 && orderData && (
                <div className="space-y-4 flex-1 flex flex-col justify-between text-center">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Scan & Pay within {countdown}s</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {paymentMethod === "FIUU_QR" ? "Scan QR with Any eWallet" : "Insert or Tap Card on Terminal"}
                    </h2>
                    <p className="text-xs text-[#888] mt-0.5">
                      DuitNow • Touch &apos;n Go • Boost • MAE • GrabPay
                    </p>
                  </div>

                  {/* QR Box */}
                  <div className="flex flex-col items-center my-2">
                    <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-[#333] relative">
                      {paymentMethod === "FIUU_QR" ? (
                        orderData.imageUrl ? (
                          <img
                            src={orderData.imageUrl}
                            alt="Dynamic Fiuu Payment QR"
                            className="w-48 h-48 object-contain"
                          />
                        ) : (
                          <div className="w-48 h-48 flex flex-col items-center justify-center text-black">
                            <QrCode className="w-32 h-32 text-gray-900" />
                            <span className="text-[10px] font-bold mt-2">SANDBOX DYNAMIC QR</span>
                          </div>
                        )
                      ) : (
                        <div className="w-48 h-48 flex flex-col items-center justify-center text-black bg-blue-50 rounded-xl">
                          <CreditCard className="w-20 h-20 text-blue-600 animate-bounce" />
                          <span className="text-xs font-bold text-blue-800 mt-2">TAP / INSERT CARD</span>
                          <span className="text-[10px] text-gray-500">CardBiz UPT1000 POS</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-center">
                      <div className="text-sm font-bold text-[#FFCA20]">
                        Amount: RM {totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-mono text-[#888] mt-0.5">
                        Ref: {orderData.referenceNo}
                      </div>
                    </div>
                  </div>

                  {/* Polling Live Badge */}
                  <div className="bg-[#1e1e1e] p-3 rounded-xl border border-[#333] flex items-center justify-center gap-2 text-xs text-[#888]">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping"></div>
                    <span>Listening for payment confirmation (Polling 2s)...</span>
                  </div>

                  {/* Cancel Button */}
                  <button
                    onClick={() => handleCancelOrder()}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl border border-red-500/30 transition text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Transaction</span>
                  </button>
                </div>
              )}

              {/* STEP 3: SUCCESS & VIRTUAL PRINTED TICKET */}
              {step === 3 && (
                <div className="space-y-4 flex-1 flex flex-col justify-between text-center animate-fade-in">
                  <div>
                    <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/30">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
                    <p className="text-xs text-[#888]">Tickets printed below. Please collect them.</p>
                  </div>

                  {/* Virtual 80mm Printed Receipt Ticket */}
                  <div className="bg-amber-50 text-black p-5 rounded-xl shadow-2xl border border-amber-200 text-left font-mono relative overflow-hidden transform hover:scale-[1.02] transition">
                    <div className="border-b-2 border-dashed border-gray-400 pb-3 mb-3 text-center">
                      <h4 className="text-base font-extrabold tracking-wider">MS CINEMAS</h4>
                      <p className="text-[10px] text-gray-600">{cinemaName}</p>
                      <p className="text-[10px] text-gray-500">SELF-SERVICE KIOSK TICKET</p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">MOVIE:</span>
                        <span className="font-bold">{selectedMovie}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">HALL / TIME:</span>
                        <span className="font-bold">{hallName} • 08:30 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SEATS:</span>
                        <span className="font-bold text-amber-800">{selectedSeats.join(", ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">REF NO:</span>
                        <span className="font-bold">{orderData?.referenceNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PAID VIA:</span>
                        <span className="font-bold">{paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-dashed border-gray-400 pt-1.5">
                        <span className="font-bold">TOTAL:</span>
                        <span className="font-extrabold">RM {totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Barcode Mock */}
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-400 text-center">
                      <div className="h-10 bg-[repeating-linear-gradient(90deg,#111_0,#111_2px,transparent_2px,transparent_4px)] w-4/5 mx-auto"></div>
                      <p className="text-[10px] font-mono tracking-widest text-gray-700 mt-1">
                        *{orderData?.referenceNo}*
                      </p>
                    </div>
                  </div>

                  {/* Done / Reset Button */}
                  <button
                    onClick={resetSimulator}
                    className="w-full py-3.5 bg-[#FFCA20] text-black font-extrabold rounded-xl shadow-lg hover:bg-[#e5b51d] transition text-sm"
                  >
                    Done & Return to Start
                  </button>
                </div>
              )}
            </div>

            {/* Kiosk Bottom Bezel Slot (Receipt Dispenser) */}
            <div className="bg-[#181818] p-3 border-t border-[#2a2a2a] flex items-center justify-center gap-2">
              <div className="w-32 h-1.5 bg-black rounded-full border border-[#333]"></div>
              <span className="text-[9px] text-[#555] uppercase font-bold">Ticket Dispenser</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Developer Tools & Sandbox Controller Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Simulation Card */}
          <div className="bg-[#242424] border border-[#3a3a3a] p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-[#FFCA20]">
              <Terminal className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Sandbox Hardware Simulation</h3>
            </div>
            <p className="text-xs text-[#888] mb-4">
              Since physical devices are not connected, click below to simulate real-world hardware & gateway responses:
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSimulateQrSuccess}
                disabled={step !== 2}
                className="w-full p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl transition text-left flex items-center justify-between disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <QrCode className="w-5 h-5 text-[#FFCA20]" />
                  <div>
                    <div className="text-xs font-bold">Simulate Customer Paid QR</div>
                    <div className="text-[10px] text-[#888]">Simulates eWallet payment confirmation</div>
                  </div>
                </div>
                <Play className="w-4 h-4 text-[#FFCA20]" />
              </button>

              <button
                onClick={handleSimulateCardSuccess}
                disabled={step !== 2}
                className="w-full p-3.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl transition text-left flex items-center justify-between disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold">Simulate Card Tap (CardBiz EDC)</div>
                    <div className="text-[10px] text-[#888]">Simulates UPT1000 POS approval code</div>
                  </div>
                </div>
                <Play className="w-4 h-4 text-blue-400" />
              </button>

              <button
                onClick={() => handleCancelOrder(orderData?.orderId, orderData?.referenceNo, "Manual Dev Cancel")}
                disabled={step !== 2}
                className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition text-left flex items-center justify-between disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-xs font-bold">Simulate Timeout / Cancellation</div>
                    <div className="text-[10px] text-[#888]">Cancels order & releases locked seats</div>
                  </div>
                </div>
                <RotateCcw className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Real-time API & Event Logs */}
          <div className="bg-[#242424] border border-[#3a3a3a] p-5 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#888] flex items-center gap-2">
                <span>Real-Time API Logs</span>
                {isPolling && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                )}
              </h3>
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-[#666] hover:text-white"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-xs text-[#666] text-center py-6">
                  No API actions triggered yet. Click &quot;Proceed to Pay&quot; to start.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-[#181818] border border-[#333] text-xs font-mono"
                  >
                    <div className="flex justify-between text-[10px] text-[#888] mb-1">
                      <span className="font-semibold text-[#ccc]">{log.title}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <pre className="text-[11px] text-green-400 overflow-x-auto max-h-24">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
