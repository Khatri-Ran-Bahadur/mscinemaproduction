# Payment Method Icons Download Guide

## Current Status
Some payment method icons were downloaded but are not valid images. The payment page now shows **text labels** for all e-wallets so users can identify them even if images are missing.

## Manual Download Instructions

### Option 1: Download from Axaipay Logo Center (Recommended)
Visit: https://www.axaipay.com/axaipay-logo-center
- This site provides official logos for all Malaysian payment methods
- Download the icons and save them to `/public/images/` with these names:
  - `payment-alipay.png`
  - `payment-wechatpay.png`
  - `payment-boost.png`
  - `payment-shopeepay.png`
  - `payment-touchngo.png`
  - `payment-grabpay.png`

### Option 2: Download from Official Websites

1. **Alipay**
   - Visit: https://www.alipay.com
   - Go to Brand Guidelines section
   - Download logo and save as `payment-alipay.png`

2. **WeChat Pay**
   - Visit: https://pay.weixin.qq.com
   - Download official logo
   - Save as `payment-wechatpay.png`

3. **Boost**
   - Visit: https://www.boost.com.my
   - Download logo from press/media resources
   - Save as `payment-boost.png`

4. **ShopeePay**
   - Visit: https://www.shopee.com.my
   - Download ShopeePay logo
   - Save as `payment-shopeepay.png`

5. **Touch 'n Go eWallet**
   - Visit: https://www.touchngo.com.my
   - Download eWallet logo
   - Save as `payment-touchngo.png`

6. **GrabPay**
   - Visit: https://www.grab.com
   - Download GrabPay logo
   - Save as `payment-grabpay.png`

### Option 3: Use WordPress Plugin Assets
If you have access to the WordPress site with Razer Merchant Services plugin:
- Navigate to: `wp-content/plugins/woocommerce_rms_seamless/images/`
- Copy these files:
  - `alipay.png` → `payment-alipay.png`
  - `wechatpay_my.png` → `payment-wechatpay.png`
  - `boost.png` → `payment-boost.png`
  - `shopeepay_2.png` → `payment-shopeepay.png`
  - `touchngo_ewallet.png` → `payment-touchngo.png`
  - `grabpay.png` → `payment-grabpay.png`

## Image Requirements
- Format: PNG (preferred) or JPG
- Size: 100x50px to 200x100px (will be scaled automatically)
- Background: Transparent or white
- Quality: High resolution for clarity

## Current Implementation
The payment page currently:
- Shows text labels for all e-wallets (so users can identify them)
- Falls back to credit card image if specific icon not found
- Displays proper bank logos for FPX methods

Once you add the proper images, they will automatically be used instead of the fallback.

