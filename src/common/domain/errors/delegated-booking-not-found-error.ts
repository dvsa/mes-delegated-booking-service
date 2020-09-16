export class DelegatedBookingNotFoundError extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, DelegatedBookingNotFoundError.prototype);
  }
}
