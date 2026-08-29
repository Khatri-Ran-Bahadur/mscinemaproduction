// In-memory set to store orderIds currently being processed
const activeLocks = new Set();

/**
 * Acquire an in-memory lock for a given orderId.
 * Waits up to maxWaitMs if the lock is currently held.
 * @param {string} orderId
 * @param {number} maxWaitMs Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} True if lock acquired, False if timed out
 */
export async function acquireLock(orderId, maxWaitMs = 15000) {
  const startTime = Date.now();
  
  while (activeLocks.has(orderId)) {
    if (Date.now() - startTime > maxWaitMs) {
      console.warn(`[Mutex] Timeout waiting for lock on order: ${orderId}`);
      return false;
    }
    // Wait for 200ms before checking again
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  activeLocks.add(orderId);
  return true;
}

/**
 * Release the lock for a given orderId.
 * @param {string} orderId
 */
export function releaseLock(orderId) {
  activeLocks.delete(orderId);
}

/**
 * Executes a function with an exclusive lock on the orderId.
 * @param {string} orderId
 * @param {Function} fn Async function to execute
 * @returns {Promise<any>} Result of the function, or throws error
 */
export async function withLock(orderId, fn) {
  const acquired = await acquireLock(orderId);
  if (!acquired) {
    throw new Error(`Could not acquire lock for order: ${orderId}`);
  }
  
  try {
    return await fn();
  } finally {
    releaseLock(orderId);
  }
}
