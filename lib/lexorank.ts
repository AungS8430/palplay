import { LexoRank } from "lexorank";

function generateInitialRank(): string {
  return LexoRank.middle().toString();
}

export default function getRank(leftRank: string | null, rightRank: string | null): string {
  if (!leftRank && !rightRank) {
    return generateInitialRank();
  }
  if (!leftRank) {
    const right = LexoRank.parse(rightRank!);
    return right.genPrev().toString();
  }
  if (!rightRank) {
    const left = LexoRank.parse(leftRank);
    return left.genNext().toString();
  }
  const left = LexoRank.parse(leftRank);
  const right = LexoRank.parse(rightRank);
  return left.between(right).toString();
}