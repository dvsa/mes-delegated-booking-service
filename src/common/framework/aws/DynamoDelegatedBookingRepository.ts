import { warn } from '@dvsa/mes-microservice-common/application/utils/logger';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { fromEnv, fromIni } from '@aws-sdk/credential-providers';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { DelegatedBookingRecord } from '../../domain/DelegatedBookingRecord';

const createDynamoClient = () => {
  const opts = { region: 'eu-west-1' } as DynamoDBClientConfig;

  if (process.env.USE_CREDENTIALS === 'true') {
    warn('Using AWS credentials');
    opts.credentials = fromIni();
  } else if (process.env.IS_OFFLINE === 'true') {
    warn('Using SLS offline');
    opts.credentials = fromEnv();
    opts.endpoint = process.env.DDB_OFFLINE_ENDPOINT;
  }

  return new DynamoDBClient(opts);
};

export async function getDelegatedBooking(applicationReference: number): Promise<DelegatedBookingRecord | null> {
  const ddb = createDynamoClient();
  const tableName = getDelegatedBookingTableName();

  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { applicationReference },
    }),
  );

  if (result.Item === undefined) {
    return null;
  }

  return result.Item as DelegatedBookingRecord;
}

function getDelegatedBookingTableName(): string {
  let tableName = process.env.DELEGATED_BOOKINGS_DDB_TABLE_NAME;
  if (tableName === undefined || tableName.length === 0) {
    warn('No delegated booking table name set, using the default');
    tableName = 'delegated-booking';
  }
  return tableName;
}
