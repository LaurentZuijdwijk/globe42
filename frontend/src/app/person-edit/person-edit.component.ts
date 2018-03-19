import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { PersonService } from '../person.service';
import { Gender, MaritalStatus, PersonIdentityModel, PersonModel } from '../models/person.model';
import { SearchCityService } from '../search-city.service';
import { DisplayCityPipe } from '../display-city.pipe';
import { MARITAL_STATUS_TRANSLATIONS } from '../display-marital-status.pipe';
import { GENDER_TRANSLATIONS } from '../display-gender.pipe';
import { PersonCommand } from '../models/person.command';
import { HOUSING_TRANSLATIONS } from '../display-housing.pipe';
import { FISCAL_STATUS_TRANSLATIONS } from '../display-fiscal-status.pipe';
import { HEALTH_CARE_COVERAGE_TRANSLATIONS } from '../display-health-care-coverage.pipe';
import { PersonTypeahead } from '../person/person-typeahead';
import { FullnamePipe } from '../fullname.pipe';
import { CityTypeahead } from './city-typeahead';
import { map, switchMap, tap } from 'rxjs/operators';
import { empty } from 'rxjs/observable/empty';
import { CountryTypeahead } from '../person/country-typeahead';

@Component({
  selector: 'gl-person-edit',
  templateUrl: './person-edit.component.html',
  styleUrls: ['./person-edit.component.scss']
})
export class PersonEditComponent {

  editedPerson: PersonModel | null;

  personForm: FormGroup;

  genders: Array<Gender> = GENDER_TRANSLATIONS.map(t => t.key);
  maritalStatuses: Array<MaritalStatus> = MARITAL_STATUS_TRANSLATIONS.map(t => t.key);
  housings = HOUSING_TRANSLATIONS.map(t => t.key);
  fiscalStatuses = FISCAL_STATUS_TRANSLATIONS.map(t => t.key);
  healthCareCoverages = HEALTH_CARE_COVERAGE_TRANSLATIONS.map(t => t.key);

  cityTypeahead: CityTypeahead;
  spouseTypeahead: PersonTypeahead;

  spouseIsInCouple = false;

  countryTypeahead: CountryTypeahead;

  private static emailOrEmpty(ctrl: FormControl): ValidationErrors {
    if (!ctrl.value) {
      return null;
    }
    return Validators.email(ctrl);
  }

  constructor(private personService: PersonService,
              private searchCityService: SearchCityService,
              private displayCityPipe: DisplayCityPipe,
              private route: ActivatedRoute,
              private router: Router,
              private fb: FormBuilder,
              private fullnamePipe: FullnamePipe) {
    this.editedPerson = this.route.snapshot.data['person'];

    let persons: Array<PersonIdentityModel> = this.route.snapshot.data['persons'];
    if (this.editedPerson) {
      persons = persons.filter(p => p.id !== this.editedPerson.id);
    }

    this.cityTypeahead = new CityTypeahead(this.searchCityService, this.displayCityPipe);
    this.spouseTypeahead = new PersonTypeahead(persons, this.fullnamePipe);
    this.countryTypeahead = new CountryTypeahead(this.route.snapshot.data['countries']);

    this.personForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthName: '',
      nickName: '',
      gender: ['', Validators.required],
      birthDate: null,
      address: '',
      city: null,
      email: ['', PersonEditComponent.emailOrEmpty],
      phoneNumber: '',
      adherent: [false, Validators.required],
      mediationEnabled: false,
      firstMediationAppointmentDate: null,
      maritalStatus: 'UNKNOWN',
      spouse: null,
      healthCareCoverage: 'UNKNOWN',
      healthInsurance: '',
      accompanying: '',
      socialSecurityNumber: '',
      cafNumber: '',
      entryDate: null,
      housing: 'UNKNOWN',
      housingSpace: null,
      hostName: '',
      fiscalStatus: 'UNKNOWN',
      fiscalNumber: ['', Validators.pattern(/\d{13}/)],
      fiscalStatusUpToDate: false,
      nationality: null
    });

    if (this.editedPerson) {
      if (this.editedPerson.frenchFamilySituation) {
        this.showFrenchFamilySituation();
      }
      if (this.editedPerson.abroadFamilySituation) {
        this.showAbroadFamilySituation();
      }

      this.personForm.patchValue(this.editedPerson);
    }

    this.personForm.get('spouse').valueChanges.pipe(
      tap(() => this.spouseIsInCouple = false),
      switchMap(spouse => spouse ? this.personService.get(spouse.id) : empty<PersonModel>())
    ).subscribe(spouse =>
      this.spouseIsInCouple = !!(spouse.spouse && (!this.editedPerson || (spouse.spouse.id !== this.editedPerson.id)))
    );

    // We try to keep the previously entered fiscal number even if the user chooses to set the
    // fiscal status to UNKNOWN, but if it's invalid, that would prevent the form from being submitted
    // so we set it to null in that (unlikely) case.
    this.personForm.get('fiscalStatus').valueChanges.subscribe(value => {
      const fiscalNumberCtrl = this.personForm.get('fiscalNumber');
      if (value === 'UNKNOWN' && fiscalNumberCtrl.invalid) {
        fiscalNumberCtrl.setValue(null);
      }
    });
  }

  showFrenchFamilySituation() {
    this.personForm.addControl('frenchFamilySituation', this.createFamilySituationGroup());
  }

  hideFrenchFamilySituation() {
    this.personForm.removeControl('frenchFamilySituation');
  }

  showAbroadFamilySituation() {
    this.personForm.addControl('abroadFamilySituation', this.createFamilySituationGroup());
  }

  hideAbroadFamilySituation() {
    this.personForm.removeControl('abroadFamilySituation');
  }

  save() {
    const formValue = this.personForm.value;

    formValue.spouseId = formValue.spouse ? formValue.spouse.id : null;
    delete formValue.spouse;

    formValue.nationalityId = formValue.nationality ? formValue.nationality.id : null;
    delete formValue.nationality;

    const command: PersonCommand = formValue;

    let action;
    if (this.editedPerson && this.editedPerson.id !== undefined) {
      action = this.personService.update(this.editedPerson.id, command).pipe(
        map(() => this.editedPerson.id)
      );
    } else {
      action = this.personService.create(command).pipe(
        map(createdPerson => createdPerson.id)
      );
    }
    action.subscribe((personId) => this.router.navigate(['persons', personId]));
  }

  private createFamilySituationGroup(): FormGroup {
    return this.fb.group({
      parentsPresent: this.fb.control(false),
      spousePresent: this.fb.control(false),
      childCount: this.fb.control(''),
      siblingCount: this.fb.control('')
    });
  }
}
