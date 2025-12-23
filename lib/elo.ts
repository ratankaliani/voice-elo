// ELO rating system implementation
// K-factor determines how much ratings change per game
const K_FACTOR = 32

export function calculateElo(
  rating1: number,
  rating2: number,
  score1: number // 1 if voice1 wins, 0 if voice2 wins, 0.5 for tie
): { newRating1: number; newRating2: number } {
  // Expected score for voice1
  const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400))
  
  // Expected score for voice2
  const expected2 = 1 / (1 + Math.pow(10, (rating1 - rating2) / 400))
  
  // Calculate new ratings
  const newRating1 = rating1 + K_FACTOR * (score1 - expected1)
  const newRating2 = rating2 + K_FACTOR * ((1 - score1) - expected2)
  
  return {
    newRating1: Math.round(newRating1 * 100) / 100,
    newRating2: Math.round(newRating2 * 100) / 100,
  }
}
