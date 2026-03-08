// app/api/molpay_callback/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  writeMolpayLog,
  savePaymentLogDB,
  verifyReturnSignature,
  acknowledgeResponse,
  callReserveBooking,
  callCancelBooking
} from "@/utils/molpay";

import fs from "fs";
import path from "path";

/**
 * Write callback logs into one file
 */
function writeCallbackLog(data) {
  try {
    const logDir = path.join(process.cwd(), "logs");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, "molpay_callback.log");

    const logData =
      "\n===============================\n" +
      `TIME: ${new Date().toISOString()}\n` +
      JSON.stringify(data, null, 2) +
      "\n";

    fs.appendFileSync(logFile, logData);
  } catch (err) {
    console.error("Callback log error:", err);
  }
}

export async function POST(request) {
  return handleCallback(request);
}

export async function GET(request) {
  return handleCallback(request);
}

async function handleCallback(request) {
  try {

    const returnData = {};

    const url = new URL(request.url);

    // Capture headers
    const headers = Object.fromEntries(request.headers.entries());

    // Capture query params
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Capture raw body
    const rawBody = await request.clone().text().catch(() => "");

    // 1️⃣ GET query params
    url.searchParams.forEach((value, key) => {
      returnData[key] = value;
    });

    // 2️⃣ POST form or JSON
    if (request.method === "POST") {

      const contentType = request.headers.get("content-type") || "";

      if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {

        const formData = await request.formData().catch(() => null);

        if (formData) {
          for (const [k, v] of formData.entries()) {
            returnData[k] = v;
          }
        }

      } else if (contentType.includes("application/json")) {

        const jsonBody = await request.json().catch(() => ({}));
        Object.assign(returnData, jsonBody);

      } else {

        // fallback parsing
        const params = new URLSearchParams(rawBody);
        const obj = Object.fromEntries(params.entries());

        if (Object.keys(obj).length) {
          Object.assign(returnData, obj);
        }

      }
    }

    /**
     * Write full callback request log
     */
    writeCallbackLog({
      method: request.method,
      url: request.url,
      headers,
      queryParams,
      rawBody,
      parsedData: returnData
    });

    const orderid = returnData.orderid || `unknown_${Date.now()}`;

    // Verify signature
    const isValidSignature = verifyReturnSignature(returnData);

    const SUCCESS_STATUSES = ["00"];

    const finalStatus =
      SUCCESS_STATUSES.includes(returnData.status) && isValidSignature
        ? "PAID"
        : returnData.status;

    let isSuccess = false;

    if (finalStatus === "PAID" || SUCCESS_STATUSES.includes(returnData.status)) {
      isSuccess = true;
    }

    // Save payment log
    await savePaymentLogDB({
      orderid,
      referenceNo: returnData.referenceNo || returnData.refno || null,
      transactionNo: returnData.tranID || null,
      status: finalStatus,
      amount: returnData.amount || null,
      currency: returnData.currency || null,
      channel: returnData.channel || null,
      method: request.method,
      returnData,
      isSuccess,
      remarks: isSuccess
        ? "Payment successful (callback)"
        : "Payment failed (callback)",
      request
    });

    /**
     * Find Order
     */
    let order = await prisma.order.findUnique({
      where: { orderId: orderid }
    });

    if (!order) {

      const refFromOrder = orderid.split("_")[0];

      const targetRef =
        returnData.referenceNo ||
        returnData.refno ||
        refFromOrder;

      if (targetRef) {

        console.log(
          `[Callback] Order ${orderid} not found, trying Reference No: ${targetRef}`
        );

        order = await prisma.order.findFirst({
          where: { referenceNo: targetRef },
          orderBy: { createdAt: "desc" }
        });

        if (order) {
          order = await prisma.order.update({
            where: { id: order.id },
            data: { orderId: orderid }
          });
        }
      }
    }

    /**
     * Update order
     */
    if (order) {

      returnData.storedDetails = {
        token: order.token || "",
        cinemaId: order.cinemaId || "",
        showId: order.showId || "",
        referenceNo: order.referenceNo || ""
      };

      let updateData = {
        transactionNo: returnData.tranID
      };

      if (finalStatus === "PAID" || finalStatus === "00") {

        updateData.paymentStatus = "PAID";
        updateData.status = "CONFIRMED";

        const reserveResult = await callReserveBooking(
          orderid,
          returnData.tranID,
          returnData.channel,
          returnData.appcode,
          returnData
        );

        if (reserveResult.success) {
          updateData.reserve_ticket = true;
          updateData.cancel_ticket = false;
        }

      } else if (finalStatus === "22") {

        updateData.paymentStatus = "PENDING";
        updateData.status = "PENDING";

      } else {

        updateData.paymentStatus = "FAILED";
        updateData.status = "CANCELLED";

        if (!order.cancel_ticket) {

          const cancelResult = await callCancelBooking(
            orderid,
            returnData.tranID,
            returnData.channel,
            returnData.error_desc || "Payment failed",
            returnData
          );

          if (cancelResult.success || cancelResult.error?.includes("already")) {
            updateData.cancel_ticket = true;
          }
        }
      }

      await prisma.order.update({
        where: { orderId: orderid },
        data: updateData
      });

    } else {

      console.warn(`[Callback] Order not found for OrderID: ${orderid}`);

    }

    return acknowledgeResponse();

  } catch (error) {

    console.error("[MOLPay Callback] Error", error);

    writeCallbackLog({
      error: error.message,
      stack: error.stack
    });

    return acknowledgeResponse();
  }
}