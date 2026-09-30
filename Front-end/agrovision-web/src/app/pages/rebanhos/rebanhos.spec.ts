import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Rebanhos } from './rebanhos';

describe('Rebanhos', () => {
  let component: Rebanhos;
  let fixture: ComponentFixture<Rebanhos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rebanhos],
    }).compileComponents();

    fixture = TestBed.createComponent(Rebanhos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
