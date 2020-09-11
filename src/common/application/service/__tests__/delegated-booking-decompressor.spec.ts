import { gzipSync } from 'zlib';
import { decompressDelegatedBooking } from '../delegated-booking-decompressor';
import { booking } from '../__mocks__/test-delegated-booking-decompressor';

describe('DelegatedBookingDecompressor', () => {
  describe('decompressDelegatedBooking', () => {
    it('should turn a gzip compressed + base64 encoded booking to an object', () => {
      const buffer = gzipSync(JSON.stringify(booking));
      expect(decompressDelegatedBooking(buffer)).toEqual(booking);
    });
  });
});
