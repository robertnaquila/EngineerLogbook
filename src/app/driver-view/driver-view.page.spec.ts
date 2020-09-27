import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DriverViewPage } from './driver-view.page';

describe('DriverViewPage', () => {
  let component: DriverViewPage;
  let fixture: ComponentFixture<DriverViewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DriverViewPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DriverViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
