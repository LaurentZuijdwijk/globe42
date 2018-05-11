import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { PersonModel } from './models/person.model';
import { PersonService } from './person.service';

@Injectable({ providedIn: 'root' })
export class PersonResolverService implements Resolve<PersonModel> {

  constructor(private personService: PersonService) { }

  resolve(route: ActivatedRouteSnapshot): Observable<PersonModel> {
    const personId = +route.paramMap.get('id');
    return this.personService.get(personId);
  }

}
