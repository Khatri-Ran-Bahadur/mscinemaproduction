#!/usr/bin/env node

/**
 * Direct test of queryPaymentStatus function
 * Run: node test-fiuu-query.js
 */

import crypto from 'crypto';
import 'dotenv/config';

const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
};

console.log('=== Fiuu Query Test ===');
console.log('FIUU_MERCHANT_ID:', RMS_CONFIG.merchantId ? '✓ Set' : '✗ Missing');
console.log('FIUU_VERIFY_KEY:', RMS_CONFIG.verifyKey ? '✓ Set' : '✗ Missing');
console.log('FIUU_SECRET_KEY:', RMS_CONFIG.secretKey ? '✓ Set' : '✗ Missing');
console.log('');

async function queryPaymentStatus(orderid, amount) {
  try {
    const md5 = (str) => crypto.createHash('md5').update(str, 'utf8').digest('hex');
    
    // skey for q_by_oid.php API: md5(oID + domain + verifykey + amount)
    const skey = md5(`${orderid}${RMS_CONFIG.merchantId}${RMS_CONFIG.verifyKey}${amount}`);
    
    console.log(`[Debug] Computing skey from: ${orderid} + ${RMS_CONFIG.merchantId} + ${RMS_CONFIG.verifyKey} + ${amount}`);
    console.log(`[Debug] skey (MD5): ${skey}`);
    
    const params = new URLSearchParams();
    params.set('domain', RMS_CONFIG.merchantId);
    params.set('oID', orderid);
    params.set('amount', amount);
    params.set('skey', skey);
    params.set('url', 'https://mscinemas.my/');
    params.set('type', '2');

    console.log(`[Debug] Request body:`, params.toString());

    const queryUrl = 'https://api.fiuu.com/RMS/query/q_by_oid.php';
    
    console.log(`\n[Fiuu Query] Checking status for Order: ${orderid}, Amount: ${amount}`);
    console.log(`[Fiuu Query] URL: ${queryUrl}`);
    
    const resp = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    console.log(`[Fiuu Query] HTTP Status: ${resp.status}`);

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
      return { success: false, error: 'Invalid response from gateway' };
    }

    console.log(`[Fiuu Query] Parsed Response:`, JSON.stringify(data, null, 2));
    
    return {
      success: data.StatCode === '00',
      status: data.StatCode,
      statusName: data.StatName,
      tranID: data.TranID,
      amount: data.Amount,
      raw: data
    };
  } catch (err) {
    console.error('[Fiuu Query] Error:', err);
    return { success: false, error: err.message };
  }
}

// Run the test
(async () => {
  const orderid = 'MS2383946127Q98M4J';
  const amount = '18.00';
  
  console.log(`Testing with Order ID: ${orderid}, Amount: ${amount}\n`);
  
  const result = await queryPaymentStatus(orderid, amount);
  
  console.log('\n=== Test Result ===');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✓ Query succeeded! Payment status is confirmed.');
  } else {
    console.log('\n✗ Query failed. Check error message above.');
  }
})();
