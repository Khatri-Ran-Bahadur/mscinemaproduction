#!/bin/bash

# Script to download payment method icons
# Run from project root: bash scripts/download-payment-icons.sh

cd "$(dirname "$0")/.." || exit
IMAGES_DIR="public/images"

echo "Downloading payment method icons to $IMAGES_DIR..."

# Create images directory if it doesn't exist
mkdir -p "$IMAGES_DIR"

# Alipay - Using CDN source
echo "Downloading Alipay icon..."
curl -k -L "https://img.alicdn.com/imgextra/i1/O1CN01IDpcDm1zSpTvYDaDE_!!6000000006741-2-tps-200-200.png" -o "$IMAGES_DIR/payment-alipay.png" 2>/dev/null && echo "✓ Alipay" || echo "✗ Alipay failed"

# WeChat Pay - Using CDN source  
echo "Downloading WeChat Pay icon..."
curl -k -L "https://pay.weixin.qq.com/images/wechatpay_logo.png" -o "$IMAGES_DIR/payment-wechatpay.png" 2>/dev/null && echo "✓ WeChat Pay" || echo "✗ WeChat Pay failed"

# Boost - Try multiple sources
echo "Downloading Boost icon..."
curl -k -L "https://www.boost.com.my/images/boost-logo.png" -o "$IMAGES_DIR/payment-boost.png" 2>/dev/null && echo "✓ Boost" || echo "✗ Boost failed"

# ShopeePay - Try multiple sources
echo "Downloading ShopeePay icon..."
curl -k -L "https://cf.shopee.com.my/file/shopeepay-logo.png" -o "$IMAGES_DIR/payment-shopeepay.png" 2>/dev/null && echo "✓ ShopeePay" || echo "✗ ShopeePay failed"

# Touch 'n Go eWallet
echo "Downloading Touch 'n Go eWallet icon..."
curl -k -L "https://www.touchngo.com.my/images/tng-ewallet-logo.png" -o "$IMAGES_DIR/payment-touchngo.png" 2>/dev/null && echo "✓ Touch 'n Go" || echo "✗ Touch 'n Go failed"

# GrabPay
echo "Downloading GrabPay icon..."
curl -k -L "https://www.grab.com/my/wp-content/uploads/sites/4/2018/08/grabpay-logo.png" -o "$IMAGES_DIR/payment-grabpay.png" 2>/dev/null && echo "✓ GrabPay" || echo "✗ GrabPay failed"

echo ""
echo "Download complete!"
echo ""
echo "If some downloads failed, you can manually download from:"
echo "  - Alipay: https://www.alipay.com (Brand Guidelines)"
echo "  - WeChat Pay: https://pay.weixin.qq.com"
echo "  - Boost: https://www.boost.com.my"
echo "  - ShopeePay: https://www.shopee.com.my"
echo "  - Touch 'n Go: https://www.touchngo.com.my"
echo "  - GrabPay: https://www.grab.com"
echo ""
echo "Or use Axaipay Logo Center: https://www.axaipay.com/axaipay-logo-center"

