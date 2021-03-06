import { Component } from '@angular/core';
import { PersonModel } from '../models/person.model';
import { ActivatedRoute } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { WEDDING_EVENT_TYPE_TRANSLATIONS } from '../display-wedding-event-type.pipe';
import { ConfirmService } from '../confirm.service';
import { WeddingEventService } from '../wedding-event.service';
import { WeddingEventModel } from '../models/wedding-event.model';
import { pastDate } from '../globe-validators';
import { LOCATION_TRANSLATIONS } from '../display-location.pipe';

@Component({
  selector: 'gl-person-wedding-events',
  templateUrl: './person-wedding-events.component.html',
  styleUrls: ['./person-wedding-events.component.scss']
})
export class PersonWeddingEventsComponent {

  events: Array<WeddingEventModel>;
  person: PersonModel;

  newEvent: FormGroup = null;
  maxMonth: {year: number; month: number; };
  eventTypes = WEDDING_EVENT_TYPE_TRANSLATIONS;
  locations = LOCATION_TRANSLATIONS;

  constructor(route: ActivatedRoute,
              private weddingEventService: WeddingEventService,
              private formBuilder: FormBuilder,
              private confirmService: ConfirmService) {
    this.person = route.parent.snapshot.data['person'];
    this.events = route.snapshot.data['events'];
  }

  deleteEvent(event: WeddingEventModel) {
    this.confirmService.confirm({
      message: 'Voulez-vous vraiment supprimer cet événement\u00a0?'
    }).pipe(
      switchMap(() => this.weddingEventService.delete(this.person.id, event.id)),
      switchMap(() => this.weddingEventService.list(this.person.id))
    ).subscribe(events => this.events = events);
  }

  showEventCreation() {
    const nextMonth = DateTime.local().plus({ months: 1 });
    this.maxMonth = {
      year: nextMonth.year,
      month: nextMonth.month
    };
    this.newEvent = this.formBuilder.group({
      date: [null, [Validators.required, pastDate]],
      type: [null, Validators.required],
      location: [null, Validators.required]
    });
  }

  create() {
    if (this.newEvent.invalid) {
      return;
    }

    this.weddingEventService.create(this.person.id, this.newEvent.value).pipe(
      tap(() => this.newEvent = null),
      switchMap(() => this.weddingEventService.list(this.person.id))
    ).subscribe(events => this.events = events);
  }
}
