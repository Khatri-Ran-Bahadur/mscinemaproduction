/**
 * Booking API Service
 * Handles seat locking and booking operations
 */

import { get, post } from './client';

/**
 * Lock seats for a show
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @param {number} lockType - Lock type (0 = temporary, etc.)
 * @param {Array<{seatID: number, priceID: number}>} seatData - Array of seat objects with seatID and priceID
 * @returns {Promise<object>} - Lock response with referenceNo
 */
export const lockSeats = async (cinemaId, showId, lockType = 0, seatData = []) => {
  try {
    // Body format: [{ seatID: 0, priceID: 0 }]
    const response = await post(
      `/Booking/LockSeats/${cinemaId}/${showId}/${lockType}`,
      seatData
    );
    return response;
  } catch (error) {
    console.error('Lock seats error:', error);
    throw error;
  }
};

/**
 * Release locked seats
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @param {number|string} referenceNo - Reference number from lock response
 * @param {number} lockType - Lock type (0 = temporary, etc.)
 * @returns {Promise<object>} - Release response
 */
export const releaseLockedSeats = async (cinemaId, showId, referenceNo) => {
  try {
    // Release API: /Booking/ReleaseLockedSeats/{CinemaID}/{ShowID}/{lockType}
    // ReferenceNo should be in the body or URL - checking common patterns
    // Based on typical REST patterns, referenceNo might be in URL or body
    // Trying body first, but could also be: /Booking/ReleaseLockedSeats/{CinemaID}/{ShowID}/{referenceNo}/{lockType}
    const response = await post(
      `/Booking/ReleaseLockedSeats/${cinemaId}/${showId}/${referenceNo}`,
    );
    return response;
  } catch (error) {
    console.error('Release locked seats error:', error);
    throw error;
  }
};

/**
 * Confirm locked seats
 * @param {number|string} showId - Show ID
 * @param {string} referenceNo - Reference number from lock response
 * @param {number|string} userId - User ID (0 for guest)
 * @param {string} email - User email
 * @param {number|string} membershipId - Membership ID (0 if no membership)
 * @param {number|string} paymentVia - Payment method ID
 * @param {object} options - Optional parameters
 * @param {string} options.name - User name (optional)
 * @param {string} options.passportNo - Passport number (optional)
 * @param {string} options.mobileNo - Mobile number (optional)
 * @returns {Promise<object>} - Confirm locked seats response
 */
export const confirmLockedSeats = async (
  showId,
  referenceNo,
  userId = 0,
  email = '',
  membershipId = 0,
  paymentVia = 0,
  options = {}
) => {
  try {
    const { name = '', passportNo = '', mobileNo = '' } = options;
    
    // Encode path parameters
    const encodedEmail = encodeURIComponent(email);
    const encodedName = encodeURIComponent(name || '');
    const encodedPassportNo = encodeURIComponent(passportNo || '');
    const encodedMobileNo = encodeURIComponent(mobileNo || '');
    
    // Build endpoint: /Booking/ConfirmLockedSeats/{ShowID}/{referenceNo}/{UserID}/{Email}/{MembershipID}/{PaymentVia}/Name/PassportNo/MobileNo
    // Name, PassportNo, MobileNo are query parameters based on API spec
    const queryParams = new URLSearchParams();
    if (name) queryParams.append('Name', name);
    if (passportNo) queryParams.append('PassportNo', passportNo);
    if (mobileNo) queryParams.append('MobileNo', mobileNo);
    
    const queryString = queryParams.toString();
    const endpoint = `/Booking/ConfirmLockedSeats/${showId}/${referenceNo}/${userId}/${encodedEmail}/${membershipId}/${paymentVia}${queryString ? `?${queryString}` : ''}`;
    
    const response = await post(endpoint, {});
    return response;
  } catch (error) {
    console.error('Confirm locked seats error:', error);
    throw error;
  }
};

/**
 * Release confirmed locked seats
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @param {string} referenceNo - Reference number from lock/confirm response
 * @returns {Promise<object>} - Release confirmed locked seats response
 */
export const releaseConfirmedLockedSeats = async (cinemaId, showId, referenceNo) => {
  try {
    // Endpoint: /Booking/ReleaseConfirmedLockedSeats/{CinemaID}/{ShowID}/{referenceNo}
    const response = await post(
      `/Booking/ReleaseConfirmedLockedSeats/${cinemaId}/${showId}/${referenceNo}`,
      {}
    );
    return response;
  } catch (error) {
    console.error('Release confirmed locked seats error:', error);
    throw error;
  }
};

/**
 * Reserve booking
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @param {string} referenceNo - Reference number from booking
 * @param {number|string} membershipId - Membership ID (0 if no membership)
 * @param {object} options - Optional parameters
 * @param {string} options.transactionNo - Transaction number (optional)
 * @param {string} options.cardType - Card type (optional)
 * @param {string} options.authorizeId - Authorization ID (optional)
 * @param {string} options.remarks - Remarks (optional)
 * @returns {Promise<object>} - Reserve booking response
 */
export const reserveBooking = async (
  cinemaId,
  showId,
  referenceNo,
  membershipId = 0,
  options = {}
) => {
  try {
    const { transactionNo = '', cardType = '', authorizeId = '', remarks = '' } = options;
    
    // Build query parameters for optional fields
    const queryParams = new URLSearchParams();
    if (transactionNo) queryParams.append('TransactionNo', transactionNo);
    if (cardType) queryParams.append('CardType', cardType);
    if (authorizeId) queryParams.append('AuthorizeId', authorizeId);
    if (remarks) queryParams.append('Remarks', remarks);
    
    const queryString = queryParams.toString();
    // Endpoint: /Booking/ReserveBooking/{CinemaID}/{ShowID}/{referenceNo}/{MembershipID}/TransactionNo/CardType/AuthorizeId/Remarks
    // TransactionNo, CardType, AuthorizeId, Remarks are query parameters
    const endpoint = `/Booking/ReserveBooking/${cinemaId}/${showId}/${referenceNo}/${membershipId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await post(endpoint, {});
    return response;
  } catch (error) {
    console.error('Reserve booking error:', error);
    throw error;
  }
};

/**
 * Cancel booking
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @param {string} referenceNo - Reference number from booking
 * @param {object} options - Optional parameters
 * @param {string} options.transactionNo - Transaction number (optional)
 * @param {string} options.cardType - Card type (optional)
 * @param {string} options.remarks - Remarks (optional)
 * @returns {Promise<object>} - Cancel booking response
 */
export const cancelBooking = async (
  cinemaId,
  showId,
  referenceNo,
  options = {}
) => {
  try {
    const { transactionNo = '', cardType = '', remarks = '' } = options;
    
    // Build query parameters for optional fields
    const queryParams = new URLSearchParams();
    if (transactionNo) queryParams.append('TransactionNo', transactionNo);
    if (cardType) queryParams.append('CardType', cardType);
    if (remarks) queryParams.append('Remarks', remarks);
    
    const queryString = queryParams.toString();
    // Endpoint: /Booking/CancelBooking/{CinemaID}/{ShowID}/{referenceNo}/TransactionNo/CardType/Remarks
    // TransactionNo, CardType, Remarks are query parameters
    const endpoint = `/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}${queryString ? `?${queryString}` : ''}`;
    
    const response = await post(endpoint, {});
    return response;
  } catch (error) {
    console.error('Cancel booking error:', error);
    throw error;
  }
};

/**
 * Check if membership number is valid
 * @param {number|string} membershipNo - Membership number
 * @returns {Promise<object>} - Validation response
 */
export const isValidMember = async (membershipNo) => {
  try {
    const response = await get(`/Booking/IsValidMember/${membershipNo}`);
    return response;
  } catch (error) {
    console.error('IsValidMember error:', error);
    throw error;
  }
};

/**
 * Confirm booking
 * @param {object} bookingData - Booking confirmation data
 * @returns {Promise<object>} - Booking confirmation response
 */
export const confirmBooking = async (bookingData) => {
  try {
    const response = await post('/Booking/ConfirmBooking', bookingData);
    return response;
  } catch (error) {
    console.error('Confirm booking error:', error);
    throw error;
  }
};

/**
 * Get user bookings
 * @param {number|string} userId - User ID
 * @returns {Promise<Array>} - Array of booking objects
 */
export const getMyBookings = async (userId) => {
  try {
    const response = await get(`/Booking/GetMyBookings/${userId}`);
    return response;
  } catch (error) {
    console.error('Get my bookings error:', error);
    throw error;
  }
};

export default {
  lockSeats,
  releaseLockedSeats,
  confirmLockedSeats,
  releaseConfirmedLockedSeats,
  reserveBooking,
  cancelBooking,
  confirmBooking,
  isValidMember,
  getMyBookings,
};

