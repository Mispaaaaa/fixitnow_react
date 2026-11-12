import { TechnicianProfile, Review } from '../models/index.js';

/**
 * Recomputes a technician's cached rating fields. Called inside the same
 * transaction as review create/edit/hide/restore/delete.
 */
export async function recalculateTechnicianRating(technicianId, transaction) {
  const reviews = await Review.findAll({
    where: { technicianId, isHidden: false },
    attributes: ['rating'],
    transaction,
  });

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const review of reviews) {
    distribution[review.rating] += 1;
    sum += review.rating;
  }
  const count = reviews.length;
  const average = count ? Math.round((sum / count) * 100) / 100 : 0;

  await TechnicianProfile.update(
    { avgRating: average, reviewCount: count, ratingDistribution: distribution },
    { where: { userId: technicianId }, transaction }
  );

  return { average, count, distribution };
}