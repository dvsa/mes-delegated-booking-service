import { APIGatewayProxyEvent, Context, APIGatewayEventRequestContext } from 'aws-lambda';

import createResponse from '../../../common/application/utils/createResponse';
import { HttpStatus } from '../../../common/application/api/HttpStatus';
import * as logger from '../../../common/application/utils/logger';
import { findDelegatedBooking } from '../../../common/application/delegated-booking/FindDelegatedBooking';
import { DelegatedBookingNotFoundError } from '../../../common/domain/errors/delegated-booking-not-found-error';

export async function handler(event: APIGatewayProxyEvent, fnCtx: Context) {
  const applicationReference = getAppRef(event.pathParameters);
  if (applicationReference === null) {
    return createResponse('No applicationReference provided', HttpStatus.BAD_REQUEST);
  }

  if (!isValidAppRef(applicationReference)) {
    logger.info(`App ref invalid ${applicationReference}`);
    return createResponse('Invalid applicationReference provided', HttpStatus.BAD_REQUEST);
  }

  const delegatedRequest = checkForDelegatedExaminerRole(event.requestContext);
  if (!delegatedRequest) {
    return createResponse('No delegated examiner role present in request', HttpStatus.UNAUTHORIZED);
  }

  try {
    logger.info(`Finding delegated booking for app ref ${applicationReference}`);
    const booking = await findDelegatedBooking(applicationReference);
    if (booking === null) {
      logger.customMetric('DelegatedBookingNoContent', 'Booking has no content (HTTP 204)');
      return createResponse({}, HttpStatus.NO_CONTENT);
    }
    return createResponse(booking);
  } catch (err) {
    if (err instanceof DelegatedBookingNotFoundError) {
      logger.customMetric('DelegatedBookingNotFound', 'Cannot find delegated booking (HTTP 404)');
      return createResponse({}, HttpStatus.NOT_FOUND);
    }
    logger.error(err);
    return createResponse('Unable to retrieve delegated booking', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

function getAppRef(pathParams: { [key: string]: string } | null): number | null {
  if (pathParams === null
    || typeof pathParams.applicationReference !== 'string'
    || pathParams.applicationReference.trim().length === 0) {
    logger.warn('No applicationReference path parameter found');
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
