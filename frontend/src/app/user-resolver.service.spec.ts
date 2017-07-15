import { TestBed } from '@angular/core/testing';

import { UserResolverService } from './user-resolver.service';
import { UserService } from './user.service';
import { UserModel } from './models/user.model';
import { Observable } from 'rxjs/Observable';
import { ActivatedRouteSnapshot, convertToParamMap, Params } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { JwtInterceptorService } from './jwt-interceptor.service';

describe('UserResolverService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserResolverService, UserService, JwtInterceptorService],
      imports: [HttpClientModule]
    });
  });

  it('should resolve the user', () => {
    const userService = TestBed.get(UserService);
    const expectedResult = Observable.of({id: 42} as UserModel);
    spyOn(userService, 'get').and.returnValue(expectedResult);

    const resolver = TestBed.get(UserResolverService);
    const params = { id: '42' } as Params;
    const paramMap = convertToParamMap(params);

    const routeSnapshot = { paramMap } as ActivatedRouteSnapshot;
    const result = resolver.resolve(routeSnapshot);

    expect(result).toBe(expectedResult);
    expect(userService.get).toHaveBeenCalledWith(42);
  });
});