import { resolvePocketDuel, POCKET_SPAWN_A, POCKET_SPAWN_B } from "@xian/shared";
import type { Player } from "../schema.js";

export function initDuelFields(player: Player) {
  player.inPocketDuel = false;
  player.pocketOpponentId = "";
  player.returnX = 0;
  player.returnY = 0;
  player.challengeTo = "";
  player.challengeFrom = "";
}

export function clearChallengeState(player: Player) {
  player.challengeTo = "";
  player.challengeFrom = "";
}

export function applyPocketStart(a: Player, b: Player) {
  a.returnX = a.x;
  a.returnY = a.y;
  b.returnX = b.x;
  b.returnY = b.y;
  a.inPocketDuel = true;
  b.inPocketDuel = true;
  a.pocketOpponentId = b.sessionId;
  b.pocketOpponentId = a.sessionId;
  a.x = POCKET_SPAWN_A.x;
  a.y = POCKET_SPAWN_A.y;
  b.x = POCKET_SPAWN_B.x;
  b.y = POCKET_SPAWN_B.y;
  clearChallengeState(a);
  clearChallengeState(b);
}

export function applyPocketEnd(
  winner: Player,
  loser: Player,
  loserQiBeforeZero: number,
  respawnQi: number,
): number {
  const result = resolvePocketDuel({
    loserQiBeforeZero,
    loserRealmFloor: loser.realmFloor,
    winnerQi: winner.currentQi,
    winnerRealmFloor: winner.realmFloor,
  });
  winner.currentQi = result.winnerQi;
  loser.realmFloor = result.loserRealmFloor;
  loser.currentQi = respawnQi;
  winner.x = winner.returnX;
  winner.y = winner.returnY;
  loser.x = loser.returnX;
  loser.y = loser.returnY;
  winner.inPocketDuel = false;
  loser.inPocketDuel = false;
  winner.pocketOpponentId = "";
  loser.pocketOpponentId = "";
  return result.transferAmount;
}
