// utils/molpay.ts
import crypto from "crypto";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export function writeMolpayLog(referenceNo, type, payload) {
  try {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `molpay_${referenceNo}.txt`);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}\n${JSON.stringify(payload, null, 2)}\n\n`;

    fs.appendFileSync(logFile, logEntry);

    // console.log(`[MOLPay API Log] ${type}`);
  } catch (err) {
    // console.error('[MOLPay API Log] Failed:', err);
  }
}

export async function savePaymentLogDB({
  orderid,
  referenceNo,
  transactionNo,
  status,
  amount,
  currency,
  channel,
  method,
  returnData,
  isSuccess,
  remarks,
  request,
}) {
  try {
    const getHeaderValue = (req, name) => {
      if (!req) return undefined;
      try {
        // Standard Fetch/Next.js Request Headers (Headers instance)
        if (req.headers && typeof req.headers.get === "function") {
          return req.headers.get(name);
        }

        // Plain object headers (e.g. { headers: { 'x-forwarded-for': '...' } })
        if (req.headers && typeof req.headers === "object") {
          const lower = name.toLowerCase();
          return req.headers[name] || req.headers[lower] || undefined;
        }

        // Sometimes a caller may pass headers directly as the request argument
        if (typeof req === "object") {
          const lower = name.toLowerCase();
          return req[name] || req[lower] || undefined;
        }
      } catch (e) {
        return undefined;
      }
      return undefined;
    };

    const ipAddress =
      getHeaderValue(request, "x-forwarded-for")?.split(",")[0]?.trim() ||
      getHeaderValue(request, "x-real-ip") ||
      "unknown";
    const userAgent =
      getHeaderValue(request, "user-agent") || request?.userAgent || "unknown";
    const amt = amount ? parseFloat(amount) : null;

    if (!orderid) return null;
    if (String(orderid).includes("unknown")) {
      return null;
    }

    await prisma.paymentLog.create({
      data: {
        orderId: orderid || null,
        referenceNo:
          referenceNo || returnData?.referenceNo || returnData?.refno || null,
        transactionNo: transactionNo || returnData?.tranID || null,
        status: status || null,
        amount: amt,
        currency: currency || returnData?.currency || "MYR",
        channel: channel || returnData?.channel || "unknown",
        method: method || "UNKNOWN",
        ipAddress,
        userAgent,
        returnData: returnData || {},
        isSuccess: !!isSuccess,
        remarks: remarks || "",
      },
    });
  } catch (err) {
    console.error("[Payment DB Log] Failed:", err);
  }
}

const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || "",
  verifyKey: process.env.FIUU_VERIFY_KEY || "",
  secretKey: process.env.FIUU_SECRET_KEY || "",
};

export function verifyReturnSignature(data) {
  try {
    const {
      tranID,
      orderid,
      status,
      domain,
      amount,
      currency,
      paydate,
      appcode,
      skey,
    } = data;
    if (
      !tranID ||
      !orderid ||
      !status ||
      !domain ||
      !amount ||
      !currency ||
      !paydate ||
      !appcode ||
      !skey
    )
      return false;

    const md5 = (str) =>
      crypto.createHash("md5").update(str, "utf8").digest("hex");

    const key0 = md5(
      `${tranID}${orderid}${status}${domain}${amount}${currency}`,
    );
    const key1 = md5(
      `${paydate}${domain}${key0}${appcode}${RMS_CONFIG.secretKey}`,
    );
    return skey === key1 || skey.toLowerCase() === key1.toLowerCase();
  } catch (e) {
    console.error("[MOLPay Return] verifyReturnSignature error:", e);
    return false;
  }
}

export async function callReserveBooking(
  orderid,
  tranID,
  channel,
  appcode,
  returnData,
) {
  try {
    let cinemaId = returnData.cinemaId || returnData.cinema_id || "";
    let showId = returnData.showId || returnData.show_id || "";
    let referenceNo = returnData.referenceNo || returnData.refno || "";
    let membershipId =
      returnData.membershipId || returnData.membership_id || "0";
    let token = "";

    if (!cinemaId || !showId || !referenceNo) {
      const stored = returnData.storedDetails;
      if (stored) {
        cinemaId = cinemaId || stored.cinemaId;
        showId = showId || stored.showId;
        referenceNo = referenceNo || stored.referenceNo;
        membershipId = membershipId || stored.membershipId || "0";
        token = stored.token || "";
      }
    }

    if (!cinemaId || !showId || !referenceNo)
      return { success: false, error: "Missing booking details", skip: false };

    const transactionNo = tranID || orderid;
    const cardType = "4"; // default credit/debit
    const authorizeId = appcode || tranID || transactionNo;
    const remarks = `Payment successful via ${channel || "MOLPay"}`;

    const queryParams = new URLSearchParams();
    queryParams.append("TransactionNo", transactionNo);
    queryParams.append("CardType", cardType);
    queryParams.append("AuthorizeId", authorizeId);
    queryParams.append("Remarks", remarks);

    const url = `${API_CONFIG.API_BASE_URL}/Booking/ReserveBooking/${cinemaId}/${showId}/${referenceNo}/${membershipId}/TransactionNo/CardType/AuthorizeId/Remarks?${queryParams.toString()}`;

    const headers = { accept: "*/*", "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch(url, { method: "POST", headers });
    if (!resp.ok)
      return {
        success: false,
        error: `ReserveBooking failed: ${resp.status}`,
        skip: false,
      };

    const data = await resp.json();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message || "Unknown error", skip: false };
  }
}

export async function callCancelBooking(
  orderid,
  tranID,
  channel,
  errorDesc,
  returnData,
) {
  try {
    let cinemaId = returnData.cinemaId || returnData.cinema_id || "";
    let showId = returnData.showId || returnData.show_id || "";
    let referenceNo = returnData.referenceNo || returnData.refno || "";
    let token = "";

    if (!cinemaId || !showId || !referenceNo) {
      const stored = returnData.storedDetails;
      if (stored) {
        cinemaId = cinemaId || stored.cinemaId;
        showId = showId || stored.showId;
        referenceNo = referenceNo || stored.referenceNo;
        token = stored.token || "";
      }
    }

    if (!cinemaId || !showId || !referenceNo)
      return { success: false, error: "Missing booking details", skip: false };

    const transactionNo = tranID || orderid;
    const cardType = "4";
    const remarks = errorDesc || `Payment failed via ${channel || "MOLPay"}`;

    const queryParams = new URLSearchParams();
    queryParams.append("TransactionNo", transactionNo);
    queryParams.append("CardType", cardType);
    queryParams.append("Remarks", remarks);

    const url = `${API_CONFIG.API_BASE_URL}/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}/TransactionNo/CardType/Remarks?${queryParams.toString()}`;

    const headers = { accept: "*/*", "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch(url, { method: "POST", headers });
    if (!resp.ok)
      return {
        success: false,
        error: `CancelBooking failed: ${resp.status}`,
        skip: false,
      };

    const data = await resp.json();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message || "Unknown error", skip: false };
  }
}

/**
 * Query Fiuu (MOLPay) Payment Status
 * Checks the real-time status of an order directly from the payment gateway.
 */
export async function queryPaymentStatus(orderid, amount) {
  try {
    const md5 = (str) =>
      crypto.createHash("md5").update(str, "utf8").digest("hex");

    // Ensure amount is formatted consistently (2 decimal places)
    const formattedAmount = parseFloat(amount).toFixed(2);

    // skey for q_by_oid.php API: md5(oID + domain + verifykey + amount)
    const skeySource = `${orderid}${RMS_CONFIG.merchantId}${RMS_CONFIG.verifyKey}${formattedAmount}`;
    const skey = md5(skeySource);

    const params = new URLSearchParams();
    params.set("domain", RMS_CONFIG.merchantId);
    params.set("oID", orderid);
    params.set("amount", formattedAmount);
    params.set("skey", skey);
    params.set("url", "https://mscinemas.my/"); // Mandatory placeholder for RMS API
    params.set("type", "2"); // JSON response

    // Better RMS Query URL
    const queryUrl = "https://api.fiuu.com/RMS/query/q_by_oid.php";

    const resp = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    console.log(`[Fiuu Query] HTTP Response Status: ${resp.status}`);

    if (!resp.ok) {
      throw new Error(`Query API failed with status: ${resp.status}`);
    }

    const text = await resp.text();
    console.log(`[Fiuu Query] RAW Response:`, text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`[Fiuu Query] Failed to parse JSON: ${text}`);
      return {
        success: false,
        error: "Invalid response from gateway",
        raw: text,
      };
    }

    console.log(`[Fiuu Query] Parsed for ${orderid}:`, data);

    // Check for Fiuu error response
    if (data.ErrorCode) {
      console.error(
        `[Fiuu Query] API Error - Code: ${data.ErrorCode}, Desc: ${data.ErrorDesc}`,
      );
      return {
        success: false,
        error: `Fiuu Error: ${data.ErrorDesc}`,
        errorCode: data.ErrorCode,
        raw: data,
      };
    }

    // Status '00' is success in Fiuu/MOLPay
    return {
      success: data.StatCode === "00",
      status: data.StatCode,
      statusName: data.StatName,
      tranID: data.TranID,
      amount: data.Amount,
      raw: data,
    };
  } catch (err) {
    console.error("[Fiuu Query] Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Request Refund from Fiuu
 * @param {string} refundType - 'P' for partial/full
 * @param {string} txnId - Fiuu Transaction ID (TranID)
 * @param {string} amount - Amount to refund (e.g. "86.00")
 * @param {string} refId - Unique reference ID for this refund attempt
 * @returns {Promise<object>}
 */
export async function requestRefund(refundType, txnId, amount, refId) {
  try {
    const md5 = (str) =>
      crypto.createHash("md5").update(str, "utf8").digest("hex");

    // Signature = md5( {RefundType}{MerchantID}{RefID}{TxnID}{Amount}{secret_key} )
    const signature = md5(
      `${refundType}${RMS_CONFIG.merchantId}${refId}${txnId}${amount}${RMS_CONFIG.secretKey}`,
    );

    const params = new URLSearchParams();
    params.set("RefundType", refundType);
    params.set("MerchantID", RMS_CONFIG.merchantId);
    params.set("RefID", refId);
    params.set("TxnID", txnId);
    params.set("Amount", amount);
    params.set("Signature", signature);

    const url = "https://api.fiuu.com/RMS/API/refundAPI/index.php";

    console.log(
      `[Fiuu Refund] Requesting refund for Txn: ${txnId}, Amount: ${amount}, Ref: ${refId}`,
    );

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!resp.ok) {
      throw new Error(`Refund API failed with status: ${resp.status}`);
    }

    const data = await resp.json();
    console.log(`[Fiuu Refund] Response:`, data);

    // Verify response signature: md5( {RefundType}{MerchantID}{RefID}{RefundID}{TxnID}{Amount}{Status}{secret_key} )
    const expectedSig = md5(
      `${data.RefundType}${data.MerchantID}${data.RefID}${data.RefundID}${data.TxnID}${data.Amount}${data.Status}${RMS_CONFIG.secretKey}`,
    );
    const isSigValid =
      data.Signature &&
      data.Signature.toLowerCase() === expectedSig.toLowerCase();

    return {
      success: data.Status === "00",
      status: data.Status,
      refundId: data.RefundID,
      isSigValid,
      raw: data,
    };
  } catch (err) {
    console.error("[Fiuu Refund] Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Query Refund Status from Fiuu
 * @param {string} id - Either TxnID or RefID
 * @param {string} type - 'txn' or 'ref'
 * @returns {Promise<object>}
 */
export async function queryRefundStatus(id, type = "txn") {
  try {
    const md5 = (str) =>
      crypto.createHash("md5").update(str, "utf8").digest("hex");

    const url =
      type === "txn"
        ? "https://api.fiuu.com/RMS/API/refundAPI/q_by_txn.php"
        : "https://api.fiuu.com/RMS/API/refundAPI/q_by_refID.php";

    // Signature: md5( {ID}{MerchantID}{verify_key} )
    const signature = md5(
      `${id}${RMS_CONFIG.merchantId}${RMS_CONFIG.verifyKey}`,
    );

    const params = new URLSearchParams();
    params.set("MerchantID", RMS_CONFIG.merchantId);
    if (type === "txn") params.set("TxnID", id);
    else params.set("RefID", id);
    params.set("Signature", signature);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!resp.ok) {
      throw new Error(`Refund Status API failed with status: ${resp.status}`);
    }

    const data = await resp.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("[Fiuu Refund Status] Error:", err);
    return { success: false, error: err.message };
  }
}

export function acknowledgeResponse() {
  return new NextResponse("RECEIVEOK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export function createRedirectResponse(redirectUrl) {
  const escapedUrl = redirectUrl
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body>
  <script>try{window.top.location.replace('${escapedUrl}');}catch(e){window.location.href='${escapedUrl}';}</script>
  <p>Redirecting... <a href="${escapedUrl}">Click here if not redirected</a></p>
  </body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
