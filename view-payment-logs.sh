#!/bin/bash

# Payment Log Viewer - Quick script to view payment logs
# Usage: ./view-payment-logs.sh [orderid]

ORDER_ID=$1

if [ -z "$ORDER_ID" ]; then
    echo "Usage: ./view-payment-logs.sh [orderid]"
    echo ""
    echo "Example: ./view-payment-logs.sh MS8362020941L7H5AI"
    echo ""
    echo "=== Recent Payment Logs ==="
    ls -lht /var/www/mscinemas/logs/payment-*.log 2>/dev/null | head -5 || echo "No payment logs yet"
    echo ""
    echo "=== Recent Raw Callbacks ==="
    ls -lht /var/www/mscinemas/public/payment-logs/ 2>/dev/null | head -5 || echo "No callback logs yet"
    echo ""
    echo "=== Stored Booking Details ==="
    ls -lht /var/www/mscinemas/temp/booking-details/ 2>/dev/null | head -5 || echo "No stored bookings"
    exit 0
fi

echo "=========================================="
echo "Payment Logs for Order: $ORDER_ID"
echo "=========================================="

echo ""
echo "1. STORED BOOKING DETAILS"
echo "----------------------------------------"
if [ -f "/var/www/mscinemas/temp/booking-details/$ORDER_ID.json" ]; then
    cat /var/www/mscinemas/temp/booking-details/$ORDER_ID.json | jq . 2>/dev/null || cat /var/www/mscinemas/temp/booking-details/$ORDER_ID.json
else
    echo "❌ Not found (either not created or already cleaned up after successful processing)"
fi

echo ""
echo "2. RAW PAYMENT CALLBACK DATA"
echo "----------------------------------------"
RAW_LOGS=$(ls /var/www/mscinemas/public/payment-logs/ 2>/dev/null | grep "$ORDER_ID")
if [ -n "$RAW_LOGS" ]; then
    for log in $RAW_LOGS; do
        echo "File: $log"
        cat "/var/www/mscinemas/public/payment-logs/$log" | jq . 2>/dev/null || cat "/var/www/mscinemas/public/payment-logs/$log"
        echo ""
    done
else
    echo "❌ No raw callback logs found"
fi

echo ""
echo "3. PAYMENT PROCESSING LOG"
echo "----------------------------------------"
if [ -f "/var/www/mscinemas/logs/payment-$ORDER_ID.log" ]; then
    cat /var/www/mscinemas/logs/payment-$ORDER_ID.log
else
    echo "❌ No processing log found (will be created when payment callback is processed)"
fi

echo ""
echo "4. ERRORS (if any)"
echo "----------------------------------------"
if [ -f "/var/www/mscinemas/logs/payment-$ORDER_ID.log" ]; then
    ERRORS=$(grep -i "error\|ERROR" /var/www/mscinemas/logs/payment-$ORDER_ID.log 2>/dev/null)
    if [ -n "$ERRORS" ]; then
        echo "$ERRORS"
    else
        echo "✅ No errors found"
    fi
else
    echo "❌ No processing log to check"
fi

echo ""
echo "=========================================="
