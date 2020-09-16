import { TestSlot } from '@dvsa/mes-journal-schema';

export interface DelegatedBookingRecord {
  applicationReference: string;
  staffNumber: string;
  bookingDetail: Buffer;
}

export interface DelegatedExaminerTestSlot {
  examinerId: string;
  testSlot: TestSlot;
}
