import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnboardingProdutor } from './onboarding-produtor';

describe('OnboardingProdutor', () => {
  let component: OnboardingProdutor;
  let fixture: ComponentFixture<OnboardingProdutor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingProdutor],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingProdutor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
