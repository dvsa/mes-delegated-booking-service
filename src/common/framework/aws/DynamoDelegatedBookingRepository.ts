import { DynamoDB } from 'aws-sdk';

import * as logger from '../../../common/application/utils/logger';
import { DelegatedBookingRecord } from '../../domain/DelegatedBookingRecord';

const createDynamoClient = () => {
  return process.env.IS_OFFLINE === 'true'
    ? new DynamoDB.DocumentClient({ endpoint: 'http://localhost:8000' })
    : new DynamoDB.DocumentClient();
};

const ddb = createDynamoClient();
const tableName = getDelegatedBookingTableName();

export async function getDelegatedBooking(applicationReference: number): Promise<DelegatedBookingRecord | null> {
  const delegatedBookingGetResult = await ddb.get({
    TableName: tableName,
    Key: {
      applicationReference,
    },
  }).promise();

  if (delegatedBookingGetResult.Item === undefined) {
    return null;
  }

  return delegatedBookingGetResult.Item as DelegatedBookingRecord;
}

function getDelegatedBookingTableName(): string {
  let tableName = process.env.DELEGATED_BOOKING_DDB_TABLE_NAME;
  if (tableName === undefined || tableName.length === 0) {
    logger.warn('No delegated booking table name set, using the default');
    tableName = 'delegated-booking';
  }
  return tableName;
}
