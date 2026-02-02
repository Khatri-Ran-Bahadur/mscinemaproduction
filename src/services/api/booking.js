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
 * API Signature based on curl example:
 * /Booking/ConfirmLockedSeats/{ShowID}/{ReferenceNo}/{UserID}/{Email}/{MembershipID}/{PaymentVia}/Name/PassportNo/MobileNo?Name={Name}&MobileNo={MobileNo}&PassportNo={PassportNo}
 * 
 * Response: { "id": 0, "remarks": "Failed" } or { "id": 1, "remarks": "Success" }
 * 
 * @param {number|string} showId - Show ID
 * @param {string} referenceNo - Reference number from lock response
 * @param {number|string} userId - User ID (0 for guest, -1 if no user)
 * @param {string} email - User email
 * @param {number|string} membershipId - Membership ID (0 if no membership)
 * @param {number|string} paymentVia - Payment method ID (0 = RHB, 1 = HotWallet, 2 = RHB MPGS, 3 = Molpay)
 * @param {string} name - User name
 * @param {string} passportNo - Passport number (empty string if not provided)
 * @param {string} mobileNo - Mobile number
 * @returns {Promise<object>} - Confirm locked seats response with {id, remarks}
 */
export const confirmLockedSeats = async (
  showId,
  referenceNo,
  userId = -1,
  email = '',
  membershipId = 0,
  paymentVia = 3,
  name = '',
  passportNo = '',
  mobileNo = ''
) => {
  try {
    // Encode path parameters
    const encodedShowId = encodeURIComponent(showId);
    const encodedReferenceNo = encodeURIComponent(referenceNo);
    const encodedUserId = encodeURIComponent(userId);
    const encodedEmail = encodeURIComponent(email || '');
    const encodedMembershipId = encodeURIComponent(membershipId);
    const encodedPaymentVia = encodeURIComponent(paymentVia);
    
    // Build query parameters for Name, PassportNo, MobileNo
    const queryParams = new URLSearchParams();
    if (name) queryParams.append('Name', name);
    if (mobileNo) queryParams.append('MobileNo', mobileNo);
    if (passportNo) queryParams.append('PassportNo', passportNo);
    
    const queryString = queryParams.toString();
    
    // Build endpoint: /Booking/ConfirmLockedSeats/{ShowID}/{ReferenceNo}/{UserID}/{Email}/{MembershipID}/{PaymentVia}/Name/PassportNo/MobileNo?Name=...&MobileNo=...&PassportNo=...
    const endpoint = `/Booking/ConfirmLockedSeats/${encodedShowId}/${encodedReferenceNo}/${encodedUserId}/${encodedEmail}/${encodedMembershipId}/${encodedPaymentVia}/Name/PassportNo/MobileNo${queryString ? `?${queryString}` : ''}`;
    
    console.log('ConfirmLockedSeats endpoint:', endpoint);
    
    // Log request details to server for debugging
    try {
      if (typeof window !== 'undefined') {
        const logData = {
          type: 'CONFIRM_LOCKED_SEATS_REQUEST',
          endpoint: endpoint,
          params: {
            showId, referenceNo, userId, email, membershipId, paymentVia, name, passportNo, mobileNo
          },
          timestamp: new Date().toISOString()
        };
        
       
      }
    } catch (e) {
      // Ignore logging errors
    }
    
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
    // Endpoint: /Booking/CancelBooking/{CinemaID}/{ShowID}/{referenceNo}/TransactionNo/CardType/Remarks
    // Matches logic in molpay_return/route.js which is confirmed working
    const endpoint = `/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}/TransactionNo/CardType/Remarks?${queryString}`;
    
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

/**
 * Get tickets for a booking
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @param {string} referenceNo - Reference number from booking
 * @returns {Promise<object>} - Ticket data with booking and ticket details
 */
export const getTickets = async (cinemaId, showId, referenceNo) => {
  try {
    const response = await get(`/Booking/GetTickets/${cinemaId}/${showId}/${referenceNo}`);
    return response;
  } catch (error) {
    console.error('Get tickets error:', error);
    throw error;
  }
};



/**
 * Get Half Way Bookings
 * @param {number} minutes1 - Duration between LockSeats and ConfirmLockedSeats
 * @param {number} minutes2 - After ConfirmLockedSeats until Payment completed time
 * @returns {Promise<Array>} - List of half way bookings
 */
export const getHalfWayBookings = async (minutes1 = 2, minutes2 = 15) => {
  try {
    const response = await get(`/Booking/GetHalfWayBookings/${minutes1}/${minutes2}`);
    return response;
  } catch (error) {
    console.error('Get half way bookings error:', error);
    throw error;
  }
};

/**
 * Release Confirm Locked Seats (Singular Confirm/Confirmed?)
 * Matching user request EXACTLY: ReleaseConfirmLockedSeats
 */
export const releaseConfirmLockedSeats = async (cinemaId, showId, referenceNo) => {
    try {
      // User says 404 on ReleaseConfirmLockedSeats.
      // Trying the existing ReleaseConfirmedLockedSeats endpoint which corresponds to status 1 (Confirmed Locked)
      const response = await post(
        `/Booking/ReleaseConfirmedLockedSeats/${cinemaId}/${showId}/${referenceNo}`,
        {}
      );
      return response;
    } catch (error) {
      console.error('Release confirm locked seats error:', error);
      throw error;
    }
  };

export default {
    lockSeats,
    releaseLockedSeats,
    confirmLockedSeats,
    releaseConfirmedLockedSeats,
    releaseConfirmLockedSeats,
    reserveBooking,
    cancelBooking,
    confirmBooking,
    isValidMember,
    getMyBookings,
    getTickets,
    getHalfWayBookings,
  };

