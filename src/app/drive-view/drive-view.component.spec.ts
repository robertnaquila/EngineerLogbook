import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DriveViewComponent } from './drive-view.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('DriveViewComponent', () => {
  let component: DriveViewComponent;
  let fixture: ComponentFixture<DriveViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DriveViewComponent ],
      imports: [IonicModule.forRoot()]
      //schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DriveViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
