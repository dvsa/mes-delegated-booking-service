export class DelegatedBookingDecompressionError extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, DelegatedBookingDecompressionError.prototype);
  }
}
