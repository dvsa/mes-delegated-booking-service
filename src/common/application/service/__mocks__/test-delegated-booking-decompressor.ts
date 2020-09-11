import { VehicleGearbox, Initiator } from '@dvsa/mes-journal-schema';
import { DelegatedExaminerTestSlot } from '../../../domain/DelegatedBookingRecord';

export const booking: DelegatedExaminerTestSlot = {
  examinerId: '4583912',
  testSlot: {
    vehicleTypeCode: 'C',
    booking: {
      application: {
        applicationId: 22123411,
        bookingSequence: 3,
        checkDigit: 1,
        testCategory: 'C',
      },
      candidate: {
        candidateName: {
          firstName: 'A Delegated',
          lastName: 'Candidate',
        },
        driverNumber: 'DAVID015220A99HC',
        dateOfBirth: '1980-01-01',
      },
    },
    slotDetail: {
      slotId: 1234,
      start: '2020-07-15T08:10:00',
    },
  },
};
