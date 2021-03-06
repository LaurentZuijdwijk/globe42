import { DisplayGenderPipe } from './display-gender.pipe';

describe('DisplayGenderPipe', () => {
  it('should translate genders', () => {
    const pipe = new DisplayGenderPipe();
    expect(pipe.transform('MALE')).toBe('Homme');
    expect(pipe.transform('FEMALE')).toBe('Femme');
    expect(pipe.transform('OTHER')).toBe('Autre');
  });
});
