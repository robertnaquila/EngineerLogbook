import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddDrivePage } from './add-drive.page';

describe('AddDrivePage', () => {
  let component: AddDrivePage;
  let fixture: ComponentFixture<AddDrivePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDrivePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddDrivePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
