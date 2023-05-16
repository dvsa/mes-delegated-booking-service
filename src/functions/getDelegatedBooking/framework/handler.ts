import {
  APIGatewayProxyEvent, APIGatewayEventRequestContext, APIGatewayProxyEventPathParameters,
} from 'aws-lambda';
import {
  bootstrapLogging,
  customMetric,
  error,
  info,
  warn,
} from '@dvsa/mes-microservice-common/application/utils/logger';
import createResponse from '../../../common/application/utils/createResponse';
import { HttpStatus } from '../../../common/application/api/HttpStatus';
import { findDelegatedBooking } from '../../../common/application/delegated-booking/FindDelegatedBooking';
import { DelegatedBookingNotFoundError } from '../../../common/domain/errors/delegated-booking-not-found-error';
import { Metric } from '../../../common/application/metric/metric';
import {
  DelegatedBookingDecompressionError,
} from '../../../common/domain/errors/delegated-booking-decompression-error';

export async function handler(event: APIGatewayProxyEvent) {
  bootstrapLogging('delegated-booking-service', event);

  const applicationReference = getAppRef(event.pathParameters);
  if (applicationReference === null) {
    error('No applicationReference provided');
    return createResponse('No applicationReference provided', HttpStatus.BAD_REQUEST);
  }

  if (!isValidAppRef(applicationReference)) {
    error(`App ref invalid ${applicationReference}`);
    return createResponse('Invalid applicationReference provided', HttpStatus.BAD_REQUEST);
  }

  const delegatedRequest = checkForDelegatedExaminerRole(event.requestContext);
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

    error('Unknown error', err);
    return createResponse('Unable to retrieve delegated booking', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

function getAppRef(pathParams: APIGatewayProxyEventPathParameters | null): number | null {
  if (pathParams === null
    || typeof pathParams.applicationReference !== 'string'
    || pathParams.applicationReference.trim().length === 0
  ) {
    warn('No applicationReference path parameter found');
    return null;
  }
  return Number(pathParams.applicationReference);
}

const checkForDelegatedExaminerRole = (requestContext: APIGatewayEventRequestContext): boolean => {
  if (requestContext.authorizer && typeof requestContext.authorizer.examinerRole === 'string') {
    return requestContext.authorizer.examinerRole === 'DLG';
  }
  return false;
};

const isValidAppRef = (applicationReference: number): boolean => {
  const appRefFormat: RegExp = /^[0-9]{11}$/g;
  return appRefFormat.test(String(applicationReference));
};
