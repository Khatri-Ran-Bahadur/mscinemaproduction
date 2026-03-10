/**
 * API Route: Create Fiuu Payment Request
 * Generates payment request with signature (server-side for security)
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { storeBookingDetails } from "@/utils/booking-storage";
import { prisma } from "@/lib/prisma";

// Fiuu Payment Gateway Configuration from environment variables
const FIUU_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || "",
  verifyKey: process.env.FIUU_VERIFY_KEY || "",
  secretKey: process.env.FIUU_SECRET_KEY || "",
  returnUrl: process.env.FIUU_RETURN_URL || "",
  cancelUrl: process.env.FIUU_CANCEL_URL || "",
};

// Validate configuration
if (
  !FIUU_CONFIG.merchantId ||
  !FIUU_CONFIG.verifyKey ||
  !FIUU_CONFIG.secretKey
) {
  console.error(
    "Fiuu payment gateway credentials are not configured in environment variables",
  );
}

/**
 * Generate signature for Fiuu payment request
 */
function generateSignature(params, secretKey) {
  // Sort parameters alphabetically and create query string
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  // Append secret key
  const stringToSign = `${queryString}${secretKey}`;

  // Generate SHA256 hash
  const signature = crypto
    .createHash("sha256")
    .update(stringToSign, "utf8")
    .digest("hex");
  return signature;
}

export async function POST(request) {
  try {
    // MOLPay plugin sends form data (application/x-www-form-urlencoded)
    // But we also support JSON for manual API calls
    let paymentData;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      paymentData = await request.json();
    } else {
      // Handle form data (from MOLPay plugin form submission)
      const formData = await request.formData();
      paymentData = {};
      for (const [key, value] of formData.entries()) {
        paymentData[key] = value;
      }
    }

    // Extract fields matching process_order.php format (official Fiuu demo)
    const {
      payment_options, // payment channel (e.g., 'credit', 'fpx_mb2u', 'fpx', 'creditAN')
      total_amount, // amount as string
      billingFirstName,
      billingLastName,
      billingEmail,
      billingMobile,
      billingAddress,
      currency = "MYR",
      molpaytimer = "",
      molpaytimerbox = "",
      razertimer = "", // Alternative name used in demo
      cancelUrl,
      returnUrl,
      notifyUrl = "",
      referenceNo = "", // Booking reference number (optional)
      cinemaId = "", // Cinema ID for ReserveBooking API
      showId = "", // Show ID for ReserveBooking API
      membershipId = "", // Membership ID for ReserveBooking API
      token = "", // Auth token from client
      // Additional Order fields
      movieId = "",
      movieTitle = "",
      cinemaName = "",
      hallName = "",
      showTime = "",
      seats = "",
      ticketType = "",
      userId = "",
    } = paymentData;

    if (!referenceNo) {
      return NextResponse.json(
        { error: "Missing referenceNo" },
        { status: 400 },
      );
    }

    // 1. Check if an order already exists for this referenceNo
    const existingOrder = await prisma.order.findUnique({
      where: { referenceNo: referenceNo },
    });

    // Generate a fresh unique Order ID for every payment attempt.
    // Format: {referenceNo}_{8-digit-timestamp}{random} (One underscore after referenceNo)
    const shortTs = Math.floor(Date.now() / 1000)
      .toString()
      .slice(-8);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const orderId = `${referenceNo}_${shortTs}${random}`;

    console.log(
      `[Payment Create] Fresh Order ID generated: ${orderId} for Reference No: ${referenceNo}`,
    );

    // Use return URL and cancel URL from env if provided, otherwise use from request
    let finalReturnUrl = FIUU_CONFIG.returnUrl || returnUrl;
    let finalCancelUrl = FIUU_CONFIG.cancelUrl || cancelUrl;

    // Add booking details to return URL if provided (for ReserveBooking/CancelBooking API calls)
    if (finalReturnUrl && (cinemaId || showId || referenceNo)) {
      try {
        const returnUrlObj = new URL(finalReturnUrl);
        if (cinemaId) returnUrlObj.searchParams.set("cinemaId", cinemaId);
        if (showId) returnUrlObj.searchParams.set("showId", showId);
        if (referenceNo)
          returnUrlObj.searchParams.set("referenceNo", referenceNo);
        if (membershipId)
          returnUrlObj.searchParams.set("membershipId", membershipId);

        // Use 'orderid' (lowercase) to match MolPay standard convention
        if (orderId) returnUrlObj.searchParams.set("orderid", orderId);

        finalReturnUrl = returnUrlObj.toString();

        // Store booking details for retrieval during callbacks
        const bookingDetails = {
          cinemaId,
          showId,
          referenceNo,
          membershipId,
          returnUrl: finalReturnUrl,
          token, // Store the token
        };

        const stored = storeBookingDetails(orderId, bookingDetails);

        if (stored) {
          console.log(
            "[Payment Create] ✅ Booking details stored successfully for:",
            orderId,
          );
        } else {
          console.error(
            "[Payment Create] ❌ Failed to store booking details for:",
            orderId,
          );
        }
      } catch (e) {
        // Invalid URL, use as is
        console.warn(
          "[Payment Create] Invalid return URL, cannot add booking details:",
          e,
        );
      }
    }

    // Validate required fields
    if (!total_amount || !billingEmail || !finalReturnUrl || !referenceNo) {
      return NextResponse.json(
        {
          status: false,
          error_code: "400",
          error_desc: "Missing required payment parameters.",
          failureurl:
            finalCancelUrl || `${new URL(request.url).origin}/payment/failed`,
        },
        { status: 400 },
      );
    }

    const selectedPaymentOption = payment_options || "";
    const billName =
      `${billingFirstName || ""} ${billingLastName || ""}`.trim() || "Customer";
    const amount = parseFloat(total_amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { status: false, error_desc: "Invalid amount" },
        { status: 400 },
      );
    }

    // --- 2. Perform Atomic Database Update (Upsert) ---
    // This ensures we have a record in our database BEFORE the user sees the payment gateway
    const paymentMethodName = selectedPaymentOption || "Online";

    const malaysiaLocalToUTCDate = (dateTimeStr) => {
      if (!dateTimeStr) return null;

      const [datePart, timePart] = dateTimeStr.trim().split(" ");
      if (!datePart || !timePart) return null;

      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second = 0] = timePart.split(":").map(Number);

      // Malaysia = UTC+8
      // Store as UTC by subtracting 8 hours
      return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second));
    };

    await prisma.order.upsert({
      where: { referenceNo: referenceNo },
      update: {
        orderId: orderId,
        paymentMethod: paymentMethodName,
        paymentStatus: existingOrder?.paymentStatus || "PENDING",
        status:
          existingOrder?.status === "CANCELLED"
            ? "PENDING"
            : existingOrder?.status || "PENDING",
        totalAmount: amount,
        customerName: billName,
        customerEmail: billingEmail,
        customerPhone: billingMobile,
        token: token || existingOrder?.token,
        updatedAt: new Date(),
        membershipId: membershipId || null,
        userId: userId || null,
      },
      create: {
        orderId: orderId,
        referenceNo: referenceNo,
        customerName: billName,
        customerEmail: billingEmail,
        customerPhone: billingMobile || "",
        movieTitle: movieTitle || "Movie",
        movieId: movieId ? parseInt(movieId) : null,
        cinemaName: cinemaName || "",
        cinemaId: cinemaId || "",
        hallName: hallName || "",
        showId: showId || "",
        showTime: showTime ? malaysiaLocalToUTCDate(showTime) : null,
        seats: Array.isArray(seats) ? JSON.stringify(seats) : seats || "",
        ticketType: ticketType || "Standard",
        totalAmount: amount,
        paymentStatus: "PENDING",
        paymentMethod: paymentMethodName,
        status: "PENDING",
        token: token,
        membershipId: membershipId || null,
        userId: userId || null,
      },
    });

    // Build payment parameters for response
    const requestOrigin = new URL(request.url).origin;
    const upperCurrency = currency.toUpperCase();

    const params = {
      mpsmerchantid: FIUU_CONFIG.merchantId,
      mpsamount: amount.toFixed(2),
      mpsorderid: orderId,
      mpsbill_name: billName,
      mpsbill_email: billingEmail,
      mpsbill_mobile: billingMobile || "",
      mpsbill_desc: billingAddress || "Movie Ticket Booking",
      mpscountry: "MY",
      mpscurrency: upperCurrency,
      mpsreturnurl:
        finalReturnUrl?.replace("http://", "https://") || finalReturnUrl,
      mpscancelurl: (
        finalCancelUrl || `${requestOrigin}/payment/failed`
      )?.replace("http://", "https://"),
      mpslangcode: "en",
      mpsapiversion: "3.28",
      mpschannel: selectedPaymentOption || "",
    };

    // Map deprecated channel codes if necessary
    if (params.mpschannel === "maybank2u") params.mpschannel = "fpx_mb2u";

    // Generate vcode
    const vcodeString = `${params.mpsamount}${params.mpsmerchantid}${params.mpsorderid}${FIUU_CONFIG.verifyKey}${params.mpscurrency}`;
    const vcode = crypto
      .createHash("md5")
      .update(vcodeString, "utf8")
      .digest("hex");
    params.mpsvcode = vcode;

    // Build final response object
    const responseData = {
      status: true,
      ...params,
    };

    if (razertimer || molpaytimer) {
      responseData.mpstimer = parseInt(razertimer || molpaytimer);
    }
    if (molpaytimerbox) {
      responseData.mpstimerbox = molpaytimerbox;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error creating payment request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment request" },
      { status: 500 },
    );
  }
}
