import { isServiceArea, isServiceLocation } from './serviceArea.js';

describe('Oriental Mindoro service area', () => {
  it('accepts supported municipalities and MinSU Main Campus coordinates', () => {
    expect(isServiceArea('Victoria')).toBe(true);
    expect(
      isServiceLocation({
        city: 'Victoria',
        lat: 13.1537659,
        lng: 121.1860637,
      })
    ).toBe(true);
  });

  it('rejects out-of-region cities and coordinates', () => {
    expect(isServiceArea('Quezon City')).toBe(false);
    expect(
      isServiceLocation({
        city: 'Victoria',
        lat: 14.5995,
        lng: 120.9842,
      })
    ).toBe(false);
  });
});
