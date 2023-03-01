import { error } from '@dvsa/mes-microservice-common/application/utils/logger';
import { decompressDelegatedBooking } from '../service/delegated-booking-decompressor';
import { DelegatedBookingRecord, DelegatedExaminerTestSlot } from '../../domain/DelegatedBookingRecord';
import { DelegatedBookingNotFoundError } from '../../domain/errors/delegated-booking-not-found-error';
import { DelegatedBookingDecompressionError } from '../../domain/errors/delegated-booking-decompression-error';
import { getDelegatedBooking } from '../../framework/aws/DynamoDelegatedBookingRepository';

export async function findDelegatedBooking(
  appRef: number,
): Promise<DelegatedExaminerTestSlot> {
  const delegatedBookingRecord: DelegatedBookingRecord | null = await getDelegatedBooking(appRef);
  if (!delegatedBookingRecord) {
    throw new DelegatedBookingNotFoundError();
  }

  try {
    return decompressDelegatedBooking(delegatedBookingRecord.bookingDetail);
  } catch (err) {
    error('decompressDelegatedBooking err', err);
    throw new DelegatedBookingDecompressionError();
  }
}
