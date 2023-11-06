import {APIGatewayProxyEvent} from 'aws-lambda';
import {bootstrapLogging, customMetric, error, info} from '@dvsa/mes-microservice-common/application/utils/logger';
import {getPathParam} from '@dvsa/mes-microservice-common/framework/validation/event-validation';
import {HttpStatus} from '@dvsa/mes-microservice-common/application/api/http-status';
import {createResponse} from '@dvsa/mes-microservice-common/application/api/create-response';
import {findDelegatedBooking} from '../../../common/application/delegated-booking/FindDelegatedBooking';
import {DelegatedBookingNotFoundError} from '../../../common/domain/errors/delegated-booking-not-found-error';
import {Metric} from '../../../common/application/metric/metric';
import {DelegatedBookingDecompressionError} from '../../../common/domain/errors/delegated-booking-decompression-error';
import {isValidAppRef} from '../application/request-validator';
import {getRoleFromRequestContext} from '@dvsa/mes-microservice-common/framework/security/authorisation';
import {ExaminerRole} from '@dvsa/mes-microservice-common/domain/examiner-role';

export async function handler(event: APIGatewayProxyEvent) {
  bootstrapLogging('get-delegated-booking', event);

  const applicationReference = Number(getPathParam(event.pathParameters, 'applicationReference'));
  if (!applicationReference) {
    error('No applicationReference provided');
    return createResponse('No applicationReference provided', HttpStatus.BAD_REQUEST);
  }

  if (!isValidAppRef(applicationReference)) {
    error(`App ref invalid ${applicationReference}`);
    return createResponse('Invalid applicationReference provided', HttpStatus.BAD_REQUEST);
  }

  const delegatedRequest = getRoleFromRequestContext(event.requestContext) === ExaminerRole.DLG;
  if (!delegatedRequest) {
    error('No delegated examiner role present in request');
    return createResponse('No delegated examiner role present in request', HttpStatus.UNAUTHORIZED);
  }

  try {
    info(`Finding delegated booking for app ref ${applicationReference}`);

    const booking = await findDelegatedBooking(applicationReference);

    customMetric(Metric.DelegatedBookingFound, 'Delegated booking found and being returned');

    return createResponse(booking);
  } catch (err) {
    if (err instanceof DelegatedBookingNotFoundError) {
      customMetric(Metric.DelegatedBookingNotFound, 'Delegated booking not found using app ref', applicationReference);
      return createResponse({}, HttpStatus.NOT_FOUND);
    }

    if (err instanceof DelegatedBookingDecompressionError) {
      customMetric(Metric.DelegatedDecompressionError, 'Delegated booking decompression error', applicationReference);
      return createResponse('Unable to decompress booking', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    error((err instanceof Error) ? err.message : `Unknown error: ${err}`);

    return createResponse('Unable to retrieve delegated booking', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
