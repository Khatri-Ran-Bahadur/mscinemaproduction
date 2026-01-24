#!/usr/bin/env node

/**
 * MS Cinema - Disk Space Cleanup Script
 * 
 * Optimizes server disk space by removing:
 * 1. Booking detail files older than 24 hours
 * 2. Nginx access and error logs older than 24 hours
 * 3. Cron release seats log (if exists)
 * 
 * Run daily via cron job
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BOOKING_DETAILS_DIR = path.join(__dirname, '../temp/booking-details');
const LOGS_DIR = path.join(__dirname, '../logs');
const MAX_AGE_HOURS = 24;
const MAX_AGE_MS = MAX_AGE_HOURS * 60 * 60 * 1000;

/**
 * Delete files older than specified age
 */
function cleanupOldFiles(directory, maxAgeMs, filePattern = null) {
  try {
    if (!fs.existsSync(directory)) {
      console.log(`Directory does not exist: ${directory}`);
      return { deleted: 0, size: 0 };
    }

    const files = fs.readdirSync(directory);
    const now = Date.now();
    let deletedCount = 0;
    let totalSize = 0;

    files.forEach(file => {
      if (filePattern && !file.match(filePattern)) return;

      const filePath = path.join(directory, file);
      
      try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) return;

        const fileAge = now - stats.mtimeMs;
        
        if (fileAge > maxAgeMs) {
          const fileSize = stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          totalSize += fileSize;
          console.log(`  ✓ ${file} (${(fileSize / 1024).toFixed(1)} KB)`);
        }
      } catch (err) {
        console.error(`  ✗ Error: ${file} - ${err.message}`);
      }
    });

    return { deleted: deletedCount, size: totalSize };
  } catch (err) {
    console.error(`✗ Error cleaning ${directory}:`, err.message);
    return { deleted: 0, size: 0 };
  }
}

/**
 * Truncate nginx logs to save space
 */
function truncateNginxLogs() {
  const logs = [
    { name: 'nginx-access.log', path: path.join(LOGS_DIR, 'nginx-access.log') },
    { name: 'nginx-error.log', path: path.join(LOGS_DIR, 'nginx-error.log') }
  ];

  let totalFreed = 0;

  logs.forEach(log => {
    try {
      if (!fs.existsSync(log.path)) {
        console.log(`  ℹ️  ${log.name} does not exist`);
        return;
      }

      const stats = fs.statSync(log.path);
      const sizeMB = stats.size / 1024 / 1024;
      
      if (sizeMB > 0.1) { // Only truncate if larger than 100KB
        fs.writeFileSync(log.path, '');
        totalFreed += stats.size;
        console.log(`  ✓ ${log.name} (freed ${sizeMB.toFixed(2)} MB)`);
      } else {
        console.log(`  ✓ ${log.name} (${sizeMB.toFixed(2)} MB - no action needed)`);
      }
    } catch (err) {
      console.error(`  ✗ Error truncating ${log.name}:`, err.message);
    }
  });

  return totalFreed;
}

/**
 * Delete cron-release-seats.log if it exists
 */
function deleteCronLog() {
  try {
    const cronLogPath = path.join(__dirname, '../cron-release-seats.log');
    
    if (fs.existsSync(cronLogPath)) {
      const stats = fs.statSync(cronLogPath);
      fs.unlinkSync(cronLogPath);
      console.log(`  ✓ cron-release-seats.log (${(stats.size / 1024).toFixed(1)} KB)`);
      return stats.size;
    }
    return 0;
  } catch (err) {
    console.error(`  ✗ Error deleting cron log:`, err.message);
    return 0;
  }
}

// ============================================
// Main Execution
// ============================================

console.log('🧹 MS Cinema - Disk Space Cleanup');
console.log('═'.repeat(50));
console.log(`⏰ Time: ${new Date().toLocaleString()}`);
console.log(`📅 Removing files older than ${MAX_AGE_HOURS} hours\n`);

let totalSpaceFreed = 0;

// 1. Clean booking details
console.log('1️⃣  Booking Details (temp/booking-details/)');
const bookingResult = cleanupOldFiles(BOOKING_DETAILS_DIR, MAX_AGE_MS, /\.json$/);
if (bookingResult.deleted > 0) {
  console.log(`   📊 Deleted ${bookingResult.deleted} files, freed ${(bookingResult.size / 1024 / 1024).toFixed(2)} MB`);
  totalSpaceFreed += bookingResult.size;
} else {
  console.log('   ✓ No old files to delete');
}

// 2. Truncate nginx logs
console.log('\n2️⃣  Nginx Logs (logs/)');
const nginxFreed = truncateNginxLogs();
totalSpaceFreed += nginxFreed;

// 3. Delete cron log
console.log('\n3️⃣  Cron Logs');
const cronFreed = deleteCronLog();
totalSpaceFreed += cronFreed;

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`✅ Cleanup Complete!`);
console.log(`💾 Total space freed: ${(totalSpaceFreed / 1024 / 1024).toFixed(2)} MB`);
console.log('═'.repeat(50) + '\n');
