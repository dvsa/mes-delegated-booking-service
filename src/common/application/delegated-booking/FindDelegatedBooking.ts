import { decompressDelegatedBooking } from '../service/delegated-booking-decompressor';
import * as logger from '../utils/logger';
import { DelegatedBookingRecord, DelegatedExaminerTestSlot } from '../../domain/DelegatedBookingRecord';
import { DelegatedBookingNotFoundError } from '../../domain/errors/delegated-booking-not-found-error';
import { DelegatedBookingDecompressionError } from '../../domain/errors/delegated-booking-decompression-error';
import { getDelegatedBooking } from '../../framework/aws/DynamoDelegatedBookingRepository';

export async function findDelegatedBooking(
  appRef: number,
): Promise<DelegatedExaminerTestSlot | null> {
  const delegatedBookingRecord: DelegatedBookingRecord | null = await getDelegatedBooking(appRef);
  if (!delegatedBookingRecord) {
    throw new DelegatedBookingNotFoundError();
  }

  try {
    return decompressDelegatedBooking(delegatedBookingRecord.bookingDetail);
  } catch (error) {
    logger.error(error);
    throw new DelegatedBookingDecompressionError();
  }
}
