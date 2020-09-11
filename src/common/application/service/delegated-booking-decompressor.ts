import { gunzipSync } from 'zlib';
import { DelegatedExaminerTestSlot } from '../../domain/DelegatedBookingRecord';

export const decompressDelegatedBooking = (compressedBooking: Buffer): DelegatedExaminerTestSlot => {
  const unzippedJson = gunzipSync(compressedBooking).toString();
  return JSON.parse(unzippedJson);
};
