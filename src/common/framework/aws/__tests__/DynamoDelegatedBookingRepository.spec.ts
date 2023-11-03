import * as repository from '../DynamoDelegatedBookingRepository';
import {mockClient} from 'aws-sdk-client-mock';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {GetCommand, GetCommandOutput} from '@aws-sdk/lib-dynamodb';
import {DelegatedBookingRecord} from '../../../domain/DelegatedBookingRecord';

describe('Dynamo repository', () => {
  const mockDynamo = mockClient(DynamoDBClient);
  const dlgRecord = {
    applicationReference: '12345678910',
    staffNumber: '1234567',
  } as DelegatedBookingRecord;

  beforeEach(() => {
    process.env.IS_OFFLINE = 'false';
    process.env.USE_CREDENTIALS = 'false';
  });

  describe('getDelegatedBooking', () => {
    ['true', 'false'].forEach((value) => {
      it(`should return item from DynamoDB when found & IS_OFFLINE is ${value}`, async () => {
        process.env.IS_OFFLINE = value;
        mockDynamo.on(GetCommand).resolves({ $metadata: {}, Item: dlgRecord } as GetCommandOutput);
        const record = await repository.getDelegatedBooking(1234567);
        expect(record).toEqual(dlgRecord);
      });
    });

    ['true', 'false'].forEach((value) => {
      it(`should return item from DynamoDB when found & USE_CREDENTIALS is ${value}`, async () => {
        process.env.USE_CREDENTIALS = value;
        mockDynamo.on(GetCommand).resolves({ $metadata: {}, Item: dlgRecord } as GetCommandOutput);
        const record = await repository.getDelegatedBooking(1234567);
        expect(record).toEqual(dlgRecord);
      });
    });

    it('should return null when not found in DynamoDB', async () => {
      mockDynamo.on(GetCommand).resolves({ $metadata: {}, Item: undefined } as GetCommandOutput);
      const record = await repository.getDelegatedBooking(1234567);
      expect(record).toEqual(null);
    });
  });
});
