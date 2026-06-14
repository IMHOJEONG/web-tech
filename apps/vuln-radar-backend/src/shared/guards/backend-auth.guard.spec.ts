import { ExecutionContext } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { BackendAuthGuard } from './backend-auth.guard';

function createExecutionContext(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization,
        },
      }),
    }),
  } as ExecutionContext;
}

describe('BackendAuthGuard', () => {
  it('throws when backend token is not configured', () => {
    const appConfigService = {
      backendApiToken: undefined,
    } as AppConfigService;
    const guard = new BackendAuthGuard(appConfigService);

    expect(() => guard.canActivate(createExecutionContext())).toThrow(
      'Unauthorized',
    );
  });

  it('throws when authorization header is missing', () => {
    const appConfigService = {
      backendApiToken: 'expected-token',
    } as AppConfigService;
    const guard = new BackendAuthGuard(appConfigService);

    expect(() => guard.canActivate(createExecutionContext())).toThrow(
      'Unauthorized',
    );
  });

  it('throws when bearer token does not match', () => {
    const appConfigService = {
      backendApiToken: 'expected-token',
    } as AppConfigService;
    const guard = new BackendAuthGuard(appConfigService);

    expect(() =>
      guard.canActivate(createExecutionContext('Bearer wrong-token')),
    ).toThrow('Unauthorized');
  });

  it('returns true when bearer token matches', () => {
    const appConfigService = {
      backendApiToken: 'expected-token',
    } as AppConfigService;
    const guard = new BackendAuthGuard(appConfigService);

    expect(
      guard.canActivate(createExecutionContext('Bearer expected-token')),
    ).toBe(true);
  });
});
