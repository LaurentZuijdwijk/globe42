import { ParticipationItem, PersonParticipationsComponent } from './person-participations.component';
import { ParticipationModel } from '../models/participation.model';
import { ACTIVITY_TYPE_TRANSLATIONS, DisplayActivityTypePipe } from '../display-activity-type.pipe';
import { PersonModel } from '../models/person.model';
import { ParticipationService } from '../participation.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { ActivatedRoute } from '@angular/router';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { FullnamePipe } from '../fullname.pipe';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

describe('PersonParticipationsComponent', () => {

  let participations: Array<ParticipationModel>;
  let person: PersonModel;
  let route: any;

  beforeEach(() => {
    participations = [
      {
        id: 42,
        activityType: 'MEAL'
      }
    ];

    person = { id: 1, firstName: 'JB', lastName: 'Nizet' } as PersonModel;

    route = {
      parent: {snapshot: {data: {person}}},
      snapshot: {data: {participations}}
    };
  });

  describe('logic', () => {
    let component: PersonParticipationsComponent;
    const participationService = new ParticipationService(null);

    beforeEach(() => {
      component = new PersonParticipationsComponent(route, participationService);
    });

    it('should initialize person and items', () => {
      expect(component.items.length).toBe(ACTIVITY_TYPE_TRANSLATIONS.length);
      expect(component.items.filter(item => item.activityType === 'MEAL')[0]).toEqual({
        id: 42,
        activityType: 'MEAL',
        selected: true
      });
      expect(component.items.filter(item => item.activityType === 'SOCIAL_MEDIATION')[0]).toEqual({
        id: undefined,
        activityType: 'SOCIAL_MEDIATION',
        selected: false
      });

      expect(component.person).toBe(person);
    });

    it('should create a participation when item is selected', () => {
      const socialMediationItem: ParticipationItem = component.items.filter(item => item.activityType === 'SOCIAL_MEDIATION')[0];
      socialMediationItem.selected = true;

      const participation = { id: 22 } as ParticipationModel;
      spyOn(participationService, 'create').and.returnValue(Observable.of(participation));

      component.selectionChanged(socialMediationItem);

      expect(socialMediationItem.id).toBe(participation.id);
      expect(participationService.create).toHaveBeenCalledWith(person.id, socialMediationItem.activityType);
    });

    it('should switch back to unselected if creation fails', () => {
      const socialMediationItem: ParticipationItem = component.items.filter(item => item.activityType === 'SOCIAL_MEDIATION')[0];
      socialMediationItem.selected = true;

      const participation = { id: 22 } as ParticipationModel;
      spyOn(participationService, 'create').and.returnValue(Observable.throw('error'));

      component.selectionChanged(socialMediationItem);

      expect(socialMediationItem.id).toBeFalsy();
      expect(socialMediationItem.selected).toBe(false);
      expect(participationService.create).toHaveBeenCalledWith(person.id, socialMediationItem.activityType);
    });

    it('should delete a participation when item is unselected', () => {
      const mealItem: ParticipationItem = component.items.filter(item => item.activityType === 'MEAL')[0];
      const participationId = mealItem.id;
      mealItem.selected = false;
      spyOn(participationService, 'delete').and.returnValue(Observable.of(null));

      component.selectionChanged(mealItem);

      expect(mealItem.id).toBeFalsy();
      expect(participationService.delete).toHaveBeenCalledWith(person.id, participationId);
    });

    it('should switch back to selected if deletion fails', () => {
      const mealItem: ParticipationItem = component.items.filter(item => item.activityType === 'MEAL')[0];
      const participationId = mealItem.id;
      mealItem.selected = false;
      spyOn(participationService, 'delete').and.returnValue(Observable.throw('error'));

      component.selectionChanged(mealItem);

      expect(mealItem.selected).toBe(true);
      expect(participationService.delete).toHaveBeenCalledWith(person.id, participationId);
    });
  });

  describe('UI', () => {
    let fixture: ComponentFixture<PersonParticipationsComponent>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [PersonParticipationsComponent, FullnamePipe, DisplayActivityTypePipe],
        imports: [HttpClientModule, FormsModule, RouterTestingModule],
        providers: [
          ParticipationService,
          { provide: ActivatedRoute, useValue: route }
        ]
      });

      fixture = TestBed.createComponent(PersonParticipationsComponent);
      fixture.detectChanges();
    }));

    it('should have a message', () => {
      expect(fixture.nativeElement.querySelector('#message').textContent)
        .toBe('JB Nizet participe aux types d\'activités suivants :');
    });

    it('should have checkboxes', () => {
      expect(fixture.nativeElement.querySelectorAll('input').length)
        .toBe(fixture.componentInstance.items.length);
      expect(fixture.nativeElement.querySelector('#activityType-MEAL').checked).toBe(true);
      expect(fixture.nativeElement.querySelector('#activityType-HEALTH_WORKSHOP').checked).toBe(false);
    });

    it('should trigger selection change', async(() => {
      const component = fixture.componentInstance;
      spyOn(component, 'selectionChanged');

      fixture.nativeElement.querySelector('#activityType-MEAL').click();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(fixture.nativeElement.querySelector('#activityType-MEAL').checked).toBe(false);
        const mealItem = component.items.filter(item => item.activityType === 'MEAL')[0];
        expect(component.selectionChanged).toHaveBeenCalledWith(mealItem);
      });
    }));
  });
});