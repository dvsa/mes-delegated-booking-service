import { Mock, It, Times } from 'typemoq';

import * as DynamoDelegatedBookingRepository from '../../../framework/aws/DynamoDelegatedBookingRepository';
import { findDelegatedBooking } from '../FindDelegatedBooking';
import * as delegatedBookingDecompressor from '../../service/delegated-booking-decompressor';
import { DelegatedBookingNotFoundError } from '../../../domain/errors/delegated-booking-not-found-error';
import { DelegatedBookingDecompressionError } from '../../../domain/errors/delegated-booking-decompression-error';
import { DelegatedExaminerTestSlot } from '../../../domain/DelegatedBookingRecord';

const moqDecompressDelegatedBooking = Mock.ofInstance(delegatedBookingDecompressor.decompressDelegatedBooking);

const dummyWorkSchedule = Mock.ofType<DelegatedExaminerTestSlot>();
dummyWorkSchedule.setup((x: DelegatedExaminerTestSlot) => x.examinerId).returns(() => '00000000');
dummyWorkSchedule.setup((x: any) => x.then).returns(() => null);

describe('FindDelegatedBooking', () => {
  beforeEach(() => {
    moqDecompressDelegatedBooking.reset();
    spyOn(delegatedBookingDecompressor, 'decompressDelegatedBooking')
      .and.callFake(moqDecompressDelegatedBooking.object);
    moqDecompressDelegatedBooking.setup(x => x(It.isAny())).returns(() => dummyWorkSchedule.object);
  });

  describe('findDelegatedBooking', () => {
    it('should throw DelegatedBookingNotFoundError when the repo cant get the booking', async () => {
      spyOn(DynamoDelegatedBookingRepository, 'getDelegatedBooking').and.returnValue(null);

      try {
        await findDelegatedBooking(12345678910);
      } catch (err) {
        expect(err instanceof DelegatedBookingNotFoundError).toBe(true);
        return;
      }
      fail();
    });

    it('should throw a DelegatedBookingDecompressionError when the booking cannot be decompressed', async () => {
      const compressedBookingFromRepo = {
        applicationReference: '12345678910',
        staffNumber: '123467',
        bookingDetail: Buffer.from(''),
      };
      spyOn(DynamoDelegatedBookingRepository, 'getDelegatedBooking').and.returnValue(compressedBookingFromRepo);
      moqDecompressDelegatedBooking.reset();
      moqDecompressDelegatedBooking.setup(x => x(It.isAny())).throws(new Error('invalid'));

      try {
        await findDelegatedBooking(12345678910);
      } catch (err) {
        expect(err instanceof DelegatedBookingDecompressionError).toBeTruthy();
        return;
      }
      fail();
    });

    it('should return the booking embedded in the wrapper', async () => {
      const compressedBookingFromRepo = {
        applicationReference: '12345678910',
        staffNumber: '123467',
        bookingDetail: Buffer.from('abc'),
      };
      spyOn(DynamoDelegatedBookingRepository, 'getDelegatedBooking')
        .and.returnValue(compressedBookingFromRepo);

      const result = await findDelegatedBooking(12345678910);
      moqDecompressDelegatedBooking.verify(x => x(It.isValue(Buffer.from('abc'))), Times.once());
      // @ts-ignore
      expect(result.examinerId).toBe('00000000');
    });
  });
});
