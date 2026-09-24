import type { AnatomyItem, SystemId } from "../data/anatomy";
import { getQuizVisual } from "../data/quiz-visuals";

export type QuizMode = "classic" | "speed";
export type QuizQuestion = { item: AnatomyItem; options: AnatomyItem[] };
export type QuizAnswer = { itemId: string; group: string; correct: boolean };
export type GroupStats = Record<string, { correct: number; total: number }>;

export type QuizAttempt = {
  id: string;
  date: string;
  systemId: SystemId;
  systemName: string;
  score: number;
  total: number;
  groups: GroupStats;
  mode?: QuizMode;
  durationSeconds?: number;
};

export const QUIZ_HISTORY_KEY = "anatomy101:quiz-history";
export const SPEED_DURATION_SECONDS = 60;
const SPEED_QUESTION_TARGET = 180;

export function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function pickBalanced(pool: AnatomyItem[], count: number): AnatomyItem[] {
  const groups = shuffle(Array.from(new Set(pool.map((item) => item.group))));
  const queues = new Map(
    groups.map((group) => [group, shuffle(pool.filter((item) => item.group === group))]),
  );
  const selected: AnatomyItem[] = [];
  let round = 0;

  while (selected.length < Math.min(count, pool.length)) {
    let added = false;
    for (const group of shuffle(groups)) {
      const item = queues.get(group)?.[round];
      if (item && selected.length < count) {
        selected.push(item);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }

  return selected;
}

function buildOptions(item: AnatomyItem, pool: AnatomyItem[]): AnatomyItem[] {
  const seenLatin = new Set([item.latin]);
  const candidates: AnatomyItem[] = [];
  const addCandidates = (values: AnatomyItem[]) => {
    for (const candidate of shuffle(values)) {
      if (candidate.id === item.id || seenLatin.has(candidate.latin)) continue;
      seenLatin.add(candidate.latin);
      candidates.push(candidate);
      if (candidates.length === 4) break;
    }
  };

  // Yakın anatomik yapılar daha öğretici ve daha güçlü çeldiriciler üretir.
  addCandidates(pool.filter((candidate) => candidate.group === item.group));
  if (candidates.length < 4) addCandidates(pool.filter((candidate) => candidate.group !== item.group));

  return shuffle([item, ...candidates]);
}

function toQuestions(selected: AnatomyItem[], pool: AnatomyItem[]): QuizQuestion[] {
  return selected.map((item) => ({ item, options: buildOptions(item, pool) }));
}

export function buildQuestions(items: AnatomyItem[], count: number): QuizQuestion[] {
  const limit = Math.min(count, items.length);
  const visualFamilies = new Set<string>();
  const visualPool = shuffle(items).filter((item) => {
    const visual = getQuizVisual(item);
    if (!visual || visualFamilies.has(visual.key)) return false;
    visualFamilies.add(visual.key);
    return true;
  });
  const visualTarget = Math.min(Math.ceil(limit * 0.45), visualPool.length);
  const selected = pickBalanced(visualPool, visualTarget);
  const selectedIds = new Set(selected.map((item) => item.id));
  selected.push(
    ...pickBalanced(
      items.filter((item) => !selectedIds.has(item.id)),
      limit - selected.length,
    ),
  );

  return toQuestions(shuffle(selected), items);
}

export function buildSpeedQuestions(items: AnatomyItem[]): QuizQuestion[] {
  if (!items.length) return [];

  const target = Math.min(240, Math.max(SPEED_QUESTION_TARGET, items.length));
  const questions: QuizQuestion[] = [];

  while (questions.length < target) {
    const remaining = target - questions.length;
    const selected = pickBalanced(items, Math.min(items.length, remaining));
    const batch = toQuestions(shuffle(selected), items);

    if (questions.at(-1)?.item.id === batch[0]?.item.id && batch.length > 1) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }
    questions.push(...batch);
  }

  return questions;
}

export function getGroupStats(answers: QuizAnswer[]): GroupStats {
  return answers.reduce<GroupStats>((stats, answer) => {
    const group = stats[answer.group] || { correct: 0, total: 0 };
    group.total += 1;
    if (answer.correct) group.correct += 1;
    stats[answer.group] = group;
    return stats;
  }, {});
}

export function readQuizHistory(): QuizAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((attempt): attempt is QuizAttempt => {
      if (!attempt || typeof attempt !== "object") return false;
      const candidate = attempt as Partial<QuizAttempt>;
      return Boolean(
        candidate.id &&
        candidate.date &&
        candidate.systemId &&
        candidate.systemName &&
        Number.isFinite(candidate.score) &&
        Number.isFinite(candidate.total) &&
        candidate.groups &&
        typeof candidate.groups === "object",
      );
    });
  } catch {
    return [];
  }
}
