import { Mock, It, Times } from 'typemoq';
import { APIGatewayEvent, Context } from 'aws-lambda';
const lambdaTestUtils = require('aws-lambda-test-utils');

import { handler } from '../handler';
import * as createResponse from '../../../../common/application/utils/createResponse';
import * as FindDelegatedBooking from '../../../../common/application/delegated-booking/FindDelegatedBooking';
import { DelegatedBookingNotFoundError } from '../../../../common/domain/errors/delegated-booking-not-found-error';
import { tokens } from '../__mocks__/authentication-token.mock';
import { booking } from '../../../../common/application/service/__mocks__/test-delegated-booking-decompressor';

describe('getDelegatedBooking handler', () => {
  let dummyApigwEvent: APIGatewayEvent;
  let dummyContext: Context;
  let createResponseSpy: jasmine.Spy;

  const moqFindDelegatedBooking = Mock.ofInstance(FindDelegatedBooking.findDelegatedBooking);

  beforeEach(() => {
    moqFindDelegatedBooking.reset();

    createResponseSpy = spyOn(createResponse, 'default');
    dummyApigwEvent = lambdaTestUtils.mockEventCreator.createAPIGatewayEvent({
      pathParameters: {
        applicationReference: '12345678910',
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokens.employeeId_12345678,
      },
    });
    dummyApigwEvent.requestContext.authorizer = { examinerRole: 'DLG' };
    dummyContext = lambdaTestUtils.mockContextCreator(() => null);
    spyOn(FindDelegatedBooking, 'findDelegatedBooking').and.callFake(moqFindDelegatedBooking.object);
  });

  describe('given the FindJournal returns a journal', () => {
    it('should return a successful response with the journal', async () => {
      moqFindDelegatedBooking.setup(x => x(It.isAny())).returns(() => Promise.resolve(booking));
      createResponseSpy.and.returnValue({ statusCode: 200 });

      const resp = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(200);
      expect(createResponse.default).toHaveBeenCalledWith(booking);
    });
  });

  describe('given FindJournal throws a JournalNotFound error', () => {
    it('should return HTTP 404 NOT_FOUND', async () => {
      moqFindDelegatedBooking.setup(x => x(It.isAny())).throws(new DelegatedBookingNotFoundError());
      createResponseSpy.and.returnValue({ statusCode: 404 });

      const resp = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(404);
      expect(createResponse.default).toHaveBeenCalledWith({}, 404);
    });
  });

  describe('given the FindJournal throws', () => {
    it('should respond with internal server error', async () => {
      moqFindDelegatedBooking.setup(x => x(It.isAny())).throws(new Error('Unable to retrieve delegated booking'));
      createResponseSpy.and.returnValue({ statusCode: 500 });

      const resp = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(500);
      expect(createResponse.default).toHaveBeenCalledWith('Unable to retrieve delegated booking', 500);
    });
  });

  describe('given there is no data but successful request', () => {
    it('should indicate a successful request with no data', async () => {
      moqFindDelegatedBooking.setup(x => x(It.isAny())).returns(() => Promise.resolve(null));
      createResponseSpy.and.returnValue({ statusCode: 204 });

      const resp = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(204);
      expect(createResponse.default).toHaveBeenCalledWith({}, 204);
    });
  });
  describe('given there is no applicationReference provided', () => {
    it('should indicate a bad request', async () => {
      dummyApigwEvent.pathParameters = {};
      createResponseSpy.and.returnValue({ statusCode: 400 });

      const resp = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(400);
      expect(createResponse.default).toHaveBeenCalledWith('No applicationReference provided', 400);
    });
  });
  describe('given there app ref is in wrong format', () => {
    it('should indicate a bad request', async () => {
      dummyApigwEvent.pathParameters = { applicationReference: '123' };
      createResponseSpy.and.returnValue({ statusCode: 400 });

      const resp = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(400);
      expect(createResponse.default).toHaveBeenCalledWith('Invalid applicationReference provided', 400);
    });
  });
  describe('obtaining examiner role from request context', () => {
    it('should obtain a the employee role from the request context, not the JWT', async () => {
      dummyApigwEvent.requestContext.authorizer = {
        examinerRole: 'DLG',
      };
      dummyApigwEvent.pathParameters = { applicationReference: '12345678910' };
      createResponseSpy.and.returnValue({ statusCode: 200 });
      moqFindDelegatedBooking.setup(x => x(It.isAny())).returns(() => Promise.resolve(booking));

      const resp = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(200);
      expect(createResponse.default).toHaveBeenCalledWith(booking);
      moqFindDelegatedBooking.verify(x => x(It.isValue(12345678910)), Times.once());
    });
    describe('given there is no delegated role in the request context', () => {
      it('should indicate a bad request', async () => {
        dummyApigwEvent.headers = {
          'Content-Type': 'application/json',
          Authorization: tokens.employeeId_12345678,
        };
        dummyApigwEvent.requestContext.authorizer = null;
        createResponseSpy.and.returnValue({ statusCode: 401 });

        const resp = await handler(dummyApigwEvent, dummyContext);

        expect(resp.statusCode).toBe(401);
        expect(createResponse.default).toHaveBeenCalledWith('No delegated examiner role present in request', 401);
      });
    });
  });
});
