#!/bin/bash

# Payment Debug Helper Script
# Usage: ./check-payment.sh ORDER_ID

if [ -z "$1" ]; then
    echo "Usage: ./check-payment.sh ORDER_ID"
    echo "Example: ./check-payment.sh MS8362020941L7H5AI"
    exit 1
fi

ORDER_ID="$1"

echo "=================================================="
echo "Payment Debug Report for: $ORDER_ID"
echo "=================================================="

echo ""
echo "=== 1. Booking Details (Storage) ==="
if [ -f "/var/www/mscinemas/temp/booking-details/$ORDER_ID.json" ]; then
    cat "/var/www/mscinemas/temp/booking-details/$ORDER_ID.json"
    echo ""
    echo "⚠️  File still exists - might not have been processed yet"
else
    echo "✅ Not found (either never created or successfully processed and cleaned up)"
fi

echo ""
echo "=== 2. Raw MolPay Callback Data ==="
RAW_FILES=$(ls /var/www/mscinemas/public/payment-logs/ 2>/dev/null | grep "$ORDER_ID" || echo "")
if [ -z "$RAW_FILES" ]; then
    echo "❌ No callback data found"
else
    echo "Found callback files:"
    ls -lh /var/www/mscinemas/public/payment-logs/ | grep "$ORDER_ID"
    echo ""
    echo "Latest callback data:"
    LATEST=$(ls -t /var/www/mscinemas/public/payment-logs/*$ORDER_ID*.json 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
        cat "$LATEST"
    fi
fi

echo ""
echo "=== 3. Payment Processing Log ==="
if [ -f "/var/www/mscinemas/logs/payment-$ORDER_ID.log" ]; then
    cat "/var/www/mscinemas/logs/payment-$ORDER_ID.log"
else
    echo "❌ No processing log found"
fi

echo ""
echo "=== 4. Error Summary ==="
if [ -f "/var/www/mscinemas/logs/payment-$ORDER_ID.log" ]; then
    ERRORS=$(grep ERROR "/var/www/mscinemas/logs/payment-$ORDER_ID.log" 2>/dev/null || echo "")
    if [ -z "$ERRORS" ]; then
        echo "✅ No errors found"
    else
        echo "❌ Errors detected:"
        grep ERROR "/var/www/mscinemas/logs/payment-$ORDER_ID.log"
    fi
else
    echo "⚠️  No log file to check"
fi

echo ""
echo "=== 5. Success Indicators ==="
if [ -f "/var/www/mscinemas/logs/payment-$ORDER_ID.log" ]; then
    SUCCESS=$(grep -E "(API Success|Database updated|Redirecting to success)" "/var/www/mscinemas/logs/payment-$ORDER_ID.log" 2>/dev/null || echo "")
    if [ -z "$SUCCESS" ]; then
        echo "⚠️  No success indicators found"
    else
        echo "✅ Success indicators:"
        grep -E "(API Success|Database updated|Redirecting to success)" "/var/www/mscinemas/logs/payment-$ORDER_ID.log"
    fi
else
    echo "⚠️  No log file to check"
fi

echo ""
echo "=== 6. ReserveBooking API Call ==="
if [ -f "/var/www/mscinemas/logs/payment-$ORDER_ID.log" ]; then
    API_CALL=$(grep "API Call: ReserveBooking" "/var/www/mscinemas/logs/payment-$ORDER_ID.log" 2>/dev/null || echo "")
    if [ -z "$API_CALL" ]; then
        echo "❌ ReserveBooking API was NOT called"
    else
        echo "✅ ReserveBooking API was called:"
        grep "API Call: ReserveBooking" "/var/www/mscinemas/logs/payment-$ORDER_ID.log"
        echo ""
        echo "Response:"
        grep -A 1 "API response received" "/var/www/mscinemas/logs/payment-$ORDER_ID.log" 2>/dev/null || echo "No response logged"
    fi
else
    echo "⚠️  No log file to check"
fi

echo ""
echo "=================================================="
echo "End of Report"
echo "=================================================="
