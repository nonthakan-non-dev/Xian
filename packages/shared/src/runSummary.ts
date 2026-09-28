/** Server → client when a CultivationRun ends (RunEnd). */

export const RUN_SUMMARY_MESSAGE = "runSummary" as const;

export type RunSummaryPayload = {
  name: string;
  realmFloor: number;
  qiLayer: number;
  ownedSkillIds: string;
  peakCurrentQi: number;
  survivalSec: number;
};
