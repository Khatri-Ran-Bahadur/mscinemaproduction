/**
 * Booking / payment timer constants.
 * Align with cinema API GetHalfWayBookings m2 window (15 minutes after confirm).
 */

/** Seconds allowed on payment page after ConfirmLockedSeats */
export const PAYMENT_TIMER_SECONDS = 2 * 60; // 120 (2 minutes as requested)

/** Seconds for seat lock modal on seat-selection page */
export const BOOKING_LOCK_TIMER_SECONDS = 15 * 60; // 900

export const PAYMENT_TIMER_START_KEY = 'paymentTimerStart';
export const PAYMENT_IN_PROGRESS_KEY = 'paymentInProgress';
