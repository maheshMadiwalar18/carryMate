import { assertItemAllowed } from '../services/itemSafetyService';

describe('itemSafetyService.assertItemAllowed', () => {
  it('allows ordinary items', () => {
    expect(() => assertItemAllowed('Engineering Textbook', 'Data structures book')).not.toThrow();
    expect(() => assertItemAllowed('Laptop Charger')).not.toThrow();
  });

  it('blocks items with a prohibited keyword in the name', () => {
    expect(() => assertItemAllowed('Pocket knife weapon')).toThrow();
  });

  it('blocks items with a prohibited keyword hidden only in the description (cannot bypass via description)', () => {
    expect(() => assertItemAllowed('Small package', 'Contains fireworks and explosive material')).toThrow();
  });

  it('is case-insensitive', () => {
    expect(() => assertItemAllowed('COCAINE sample')).toThrow();
  });
});
