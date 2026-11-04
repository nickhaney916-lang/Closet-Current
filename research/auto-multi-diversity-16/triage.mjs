// Development-only sweep on the review-resize arm retained all five matched
// boxes at 0.925, with zero of the 28 unmatched proposals in the primary tier.
export const PRIMARY_CONFIDENCE = 0.925;

export function partitionProposals(proposals) {
  const primary = [];
  const additional = [];
  for (const proposal of proposals) {
    const confidence = proposal.confidence;
    const tier = Number.isFinite(confidence) && confidence >= PRIMARY_CONFIDENCE && confidence <= 1
      ? primary : additional;
    tier.push(proposal);
  }
  return {primary, additional};
}
