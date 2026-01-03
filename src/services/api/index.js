/**
 * API Services Index
 * Central export for all API services
 */

import * as auth from './auth';
import * as movies from './movies';
import * as cinemas from './cinemas';
import * as shows from './shows';
import * as booking from './booking';
import * as payment from './payment';
import { APIError } from './client';

export {
  auth,
  movies,
  cinemas,
  shows,
  booking,
  payment,
  APIError,
};

export default {
  auth,
  movies,
  cinemas,
  shows,
  booking,
  payment,
};

