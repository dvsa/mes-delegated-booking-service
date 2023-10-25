import { APIGatewayEventRequestContext, APIGatewayProxyEventPathParameters } from 'aws-lambda';
import { warn } from '@dvsa/mes-microservice-common/application/utils/logger';

export function getAppRef(pathParams: APIGatewayProxyEventPathParameters | null): number | null {
  if (pathParams === null
    || typeof pathParams.applicationReference !== 'string'
    || pathParams.applicationReference.trim().length === 0
  ) {
    warn('No applicationReference path parameter found');
    return null;
  }
  return Number(pathParams.applicationReference);
}

export const checkForDelegatedExaminerRole = (requestContext: APIGatewayEventRequestContext): boolean => {
  if (requestContext.authorizer && typeof requestContext.authorizer.examinerRole === 'string') {
    return requestContext.authorizer.examinerRole === 'DLG';
  }
  return false;
};

export const isValidAppRef = (applicationReference: number): boolean => {
  const appRefFormat: RegExp = /^[0-9]{11}$/g;
  return appRefFormat.test(String(applicationReference));
};
