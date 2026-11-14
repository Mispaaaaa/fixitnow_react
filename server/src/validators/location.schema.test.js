import { locationCoordinatesSchema } from './location.schema.js';

describe('locationCoordinatesSchema', () => {
  it('accepts a valid latitude and longitude', () => {
    expect(locationCoordinatesSchema.safeParse({ lat: 13.15, lng: 121.18 }).success).toBe(true);
  });

  it('rejects coordinates outside the geographic bounds', () => {
    expect(locationCoordinatesSchema.safeParse({ lat: 91, lng: 121 }).success).toBe(false);
    expect(locationCoordinatesSchema.safeParse({ lat: 13, lng: -181 }).success).toBe(false);
  });
});
