import { warn } from '@dvsa/mes-microservice-common/application/utils/logger';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DelegatedBookingRecord } from '../../domain/DelegatedBookingRecord';

const createDynamoClient = () => {
  return process.env.IS_OFFLINE === 'true'
    ? DynamoDBDocument.from(new DynamoDB({ endpoint: 'http://localhost:8000' }))
    : DynamoDBDocument.from(new DynamoDB({ region: 'eu-west-1' }));
};

const ddb = createDynamoClient();
const tableName = getDelegatedBookingTableName();

export async function getDelegatedBooking(applicationReference: number): Promise<DelegatedBookingRecord | null> {
  const response = await ddb.get({
    TableName: tableName,
    Key: { applicationReference },
  });

  if (response.Item === undefined) {
    return null;
  }

  return response.Item as DelegatedBookingRecord;
}

function getDelegatedBookingTableName(): string {
  let tableName = process.env.DELEGATED_BOOKINGS_DDB_TABLE_NAME;
  if (tableName === undefined || tableName.length === 0) {
    warn('No delegated booking table name set, using the default');
    tableName = 'delegated-booking';
  }
  return tableName;
}
