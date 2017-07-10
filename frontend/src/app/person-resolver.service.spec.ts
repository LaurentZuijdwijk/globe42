import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Params } from '@angular/router';
import { HttpModule } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { PersonResolverService } from './person-resolver.service';
import { PersonService } from './person.service';
import { PersonModel } from './models/person.model';

describe('PersonResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [PersonResolverService, PersonService],
    imports: [HttpModule]
  }));

  it('should retrieve a person', () => {
    const personService = TestBed.get(PersonService);
    const expectedResult: Observable<PersonModel> = Observable.of({ firstName: 'John', lastName: 'Doe' });

    spyOn(personService, 'get').and.returnValue(expectedResult);

    const resolver = TestBed.get(PersonResolverService);
    const params = { id: '42' } as Params;
    const paramMap = convertToParamMap(params);

    const routeSnapshot = { paramMap } as ActivatedRouteSnapshot;
    const result = resolver.resolve(routeSnapshot);

    expect(result).toBe(expectedResult);
    expect(personService.get).toHaveBeenCalledWith(42);
  });
});