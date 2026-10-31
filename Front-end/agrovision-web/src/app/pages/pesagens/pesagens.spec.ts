import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pesagens } from './pesagens';

describe('Pesagens', () => {
  let component: Pesagens;
  let fixture: ComponentFixture<Pesagens>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pesagens],
    }).compileComponents();

    fixture = TestBed.createComponent(Pesagens);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
