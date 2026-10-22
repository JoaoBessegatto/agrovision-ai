import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimalDetalhes } from './animal-detalhes';

describe('AnimalDetalhes', () => {
  let component: AnimalDetalhes;
  let fixture: ComponentFixture<AnimalDetalhes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimalDetalhes],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimalDetalhes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
