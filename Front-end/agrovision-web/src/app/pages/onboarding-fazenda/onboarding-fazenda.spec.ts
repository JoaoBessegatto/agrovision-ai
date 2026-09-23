import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnboardingFazenda } from './onboarding-fazenda';

describe('OnboardingFazenda', () => {
  let component: OnboardingFazenda;
  let fixture: ComponentFixture<OnboardingFazenda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingFazenda],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingFazenda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
