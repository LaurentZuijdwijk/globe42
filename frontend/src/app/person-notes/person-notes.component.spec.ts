import { async, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PersonNotesComponent } from './person-notes.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NoteComponent } from '../note/note.component';
import { PersonNoteService } from '../person-note.service';
import { UserService } from '../user.service';
import { JwtInterceptorService } from '../jwt-interceptor.service';
import { PersonModel } from '../models/person.model';
import { NoteModel } from '../models/note.model';
import { Observable } from 'rxjs/Observable';
import { ConfirmService } from '../confirm.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'rxjs/add/operator/debounceTime';
import { Subject } from 'rxjs/Subject';
import { By } from '@angular/platform-browser';
import createSpyObj = jasmine.createSpyObj;
import { UserModel } from '../models/user.model';

describe('PersonNotesComponent', () => {

  const person = { id: 42 } as PersonModel;
  let notes: Array<NoteModel>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientModule, NgbModule.forRoot()],
      declarations: [PersonNotesComponent, NoteComponent],
      providers: [
        PersonNoteService,
        UserService,
        JwtInterceptorService,
        ConfirmService
      ]
    });

    notes = [
      {
        id: 1,
        text: 'note 1',
        creator: null,
        creationInstant: '2017-08-09T12:00:00.000Z'
      },
      {
        id: 2,
        text: 'note 2',
        creator: null,
        creationInstant: '2017-08-10T12:00:00.000Z'
      }
    ];

    const userService = TestBed.get(UserService);
    userService.userEvents.next({ login: 'admin' } as UserModel);
  }));

  it('should display notes', () => {
    const personNoteService = TestBed.get(PersonNoteService);
    spyOn(personNoteService, 'list').and.returnValue(Observable.of(notes));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.directive(NoteComponent)).length).toBe(2);
  });

  it('should display no note message if no notes', () => {
    const personNoteService = TestBed.get(PersonNoteService);
    spyOn(personNoteService, 'list').and.returnValue(Observable.of([]));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucune note');
  });

  it('should display a spinner after 300 ms until notes are available', fakeAsync(() => {
    const personNoteService = TestBed.get(PersonNoteService);
    const subject = new Subject<Array<NoteModel>>();
    spyOn(personNoteService, 'list').and.returnValue(subject);

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();
    tick();

    expect(fixture.nativeElement.querySelector('.fa-spinner')).toBeFalsy();

    tick(350);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fa-spinner')).toBeTruthy();

    subject.next(notes);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fa-spinner')).toBeFalsy();
  }));

  it('should disable other notes when editing one', () => {
    // create component with 2 notes
    const personNoteService = TestBed.get(PersonNoteService);
    spyOn(personNoteService, 'list').and.returnValue(Observable.of(notes));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    // edit first note
    const noteComponents = fixture.debugElement.queryAll(By.directive(NoteComponent));
    noteComponents[0].nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editedNote).toBe(notes[0]);
    expect(noteComponents[0].componentInstance.edited).toBe(true);
    expect(noteComponents[1].componentInstance.disabled).toBe(true);

    // cancel first note edition
    noteComponents[0].nativeElement.querySelectorAll('button')[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editedNote).toBeNull();
    expect(noteComponents[0].componentInstance.edited).toBe(false);

    expect(noteComponents[1].componentInstance.disabled).toBe(false);
  });

  it('should delete note', () => {
    // create component with 2 notes
    const personNoteService = TestBed.get(PersonNoteService);
    const confirmService = TestBed.get(ConfirmService);
    spyOn(confirmService, 'confirm').and.returnValue(Observable.of('ok'));
    spyOn(personNoteService, 'delete').and.returnValue(Observable.of(null));
    spyOn(personNoteService, 'list').and.returnValues(Observable.of(notes), Observable.of([notes[1]]));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    // delete first note and confirm
    const noteComponents = fixture.debugElement.queryAll(By.directive(NoteComponent));
    noteComponents[0].nativeElement.querySelectorAll('button')[1].click();
    fixture.detectChanges();

    expect(personNoteService.delete).toHaveBeenCalledWith(person.id, notes[0].id);
    expect(personNoteService.list).toHaveBeenCalledWith(person.id);

    expect(fixture.debugElement.queryAll(By.directive(NoteComponent)).length).toBe(1);
  });

  it('should delete note after confirmation', () => {
    // create component with 2 notes
    const personNoteService = TestBed.get(PersonNoteService);
    const confirmService = TestBed.get(ConfirmService);
    spyOn(personNoteService, 'list').and.returnValue(Observable.of(notes));
    spyOn(personNoteService, 'delete').and.returnValue(Observable.of(null));
    spyOn(confirmService, 'confirm').and.returnValue(Observable.throw('nok'));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    // delete first note and don't confirm
    const firstNoteComponent = fixture.debugElement.query(By.directive(NoteComponent));
    firstNoteComponent.nativeElement.querySelectorAll('button')[1].click();
    fixture.detectChanges();

    expect(personNoteService.delete).not.toHaveBeenCalled();
    expect(fixture.debugElement.queryAll(By.directive(NoteComponent)).length).toBe(2);
  });

  it('should update note', async(() => {
    // create component with 2 notes
    const personNoteService = TestBed.get(PersonNoteService);
    spyOn(personNoteService, 'update').and.returnValue(Observable.of(null));
    spyOn(personNoteService, 'list').and.returnValues(Observable.of(notes), Observable.of(notes));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    // edit first note
    const noteComponents = fixture.debugElement.queryAll(By.directive(NoteComponent));
    noteComponents[0].nativeElement.querySelector('button').click();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      // change first note text
      const textArea = noteComponents[0].nativeElement.querySelector('textarea');
      textArea.value = 'new text';
      textArea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(noteComponents[0].componentInstance.editedText).toBe('new text');

      // save the change
      noteComponents[0].nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(personNoteService.update).toHaveBeenCalledWith(person.id, notes[0].id, 'new text');
      expect(personNoteService.list).toHaveBeenCalledWith(person.id);

      expect(fixture.debugElement.queryAll(By.directive(NoteComponent)).length).toBe(2);
    });
  }));

  it('should add a note at the end when creating, and remove it when cancelling', () => {
    // create component with 2 notes
    const personNoteService = TestBed.get(PersonNoteService);
    spyOn(personNoteService, 'update').and.returnValue(Observable.of(null));
    spyOn(personNoteService, 'list').and.returnValue(Observable.of(notes));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    // click on Add Note button
    const addNoteButton = fixture.nativeElement.querySelector('#addNote');
    addNoteButton.click();
    fixture.detectChanges();

    let noteComponents = fixture.debugElement.queryAll(By.directive(NoteComponent));
    expect(noteComponents.length).toBe(3);

    expect(fixture.componentInstance.editedNote).toBe(notes[2]);
    expect(noteComponents[0].componentInstance.disabled).toBe(true);
    expect(noteComponents[1].componentInstance.disabled).toBe(true);
    expect(noteComponents[2].componentInstance.edited).toBe(true);
    expect(addNoteButton.disabled).toBe(true);
    expect(noteComponents[2].nativeElement.textContent).toContain('admin');

    // cancel the edition
    noteComponents[2].nativeElement.querySelectorAll('button')[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.editedNote).toBeNull();

    noteComponents = fixture.debugElement.queryAll(By.directive(NoteComponent));
    expect(noteComponents.length).toBe(2);
    expect(noteComponents[0].componentInstance.disabled).toBe(false);
    expect(noteComponents[1].componentInstance.disabled).toBe(false);
  });

  it('should create a note', async(() => {
    // create component with 2 notes
    const newNote = {
      id: 3,
      text: 'new text',
      creator: {
        id: 1,
        login: 'admin'
      } as UserModel,
      creationInstant: '2017-08-11T12:00:00.000Z'
    };

    const personNoteService = TestBed.get(PersonNoteService);
    spyOn(personNoteService, 'create').and.returnValue(Observable.of(newNote));
    spyOn(personNoteService, 'list').and.returnValues(Observable.of(notes), Observable.of([notes[0], notes[1], newNote]));

    const fixture = TestBed.createComponent(PersonNotesComponent);
    fixture.componentInstance.person = person;
    fixture.detectChanges();

    // click on Add Note button
    const addNoteButton = fixture.nativeElement.querySelector('#addNote');
    addNoteButton.click();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      // enter text of new note
      const noteComponents = fixture.debugElement.queryAll(By.directive(NoteComponent));
      const textArea = noteComponents[2].nativeElement.querySelector('textarea');
      textArea.value = 'new text';
      textArea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(noteComponents[2].componentInstance.editedText).toBe('new text');

      // save new note
      noteComponents[2].nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(personNoteService.create).toHaveBeenCalledWith(person.id, 'new text');
      expect(personNoteService.list).toHaveBeenCalledWith(person.id);

      expect(fixture.debugElement.queryAll(By.directive(NoteComponent)).length).toBe(3);
      expect(fixture.componentInstance.editedNote).toBe(null);
    });
  }));
});