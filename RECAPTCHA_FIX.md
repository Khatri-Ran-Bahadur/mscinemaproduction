
# ReCAPTCHA Key Config

It appears the keys provided are **ReCAPTCHA v3** keys, but the application is currently built to use **ReCAPTCHA v2 (Checkbox)**. This causes the "Invalid key type" error.

## How to Fix

You need to generate **Version 2** keys from the Google Admin Console.

1. Go to [https://www.google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create)
2. Enter a Label (e.g., "Cinema Website").
3. **IMPORTANT**: Under "reCAPTCHA type", select **Challenge (v2)**.
4. Then select **"I'm not a robot" Checkbox**.
5. Add your domains.
6. Submit and copy the new **Site Key** and **Secret Key**.

## Update Keys

Once you have the new **v2** keys, update your `.env.local` file:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_new_v2_site_key
RECAPTCHA_SECRET_KEY=your_new_v2_secret_key
```

Then restart your server (`npm run dev`) to apply changes.
