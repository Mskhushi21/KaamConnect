import type { Language } from '../data/constants.ts';
import { en } from './en.ts';
import { kn } from './kn.ts';
import { hi } from './hi.ts';

export type TranslationDict = typeof en;

export const dictionaries: Record<Language, TranslationDict> = {
  en: en as unknown as TranslationDict,
  kn: kn as unknown as TranslationDict,
  hi: hi as unknown as TranslationDict,
};

export const LANGUAGE_LABELS: Record<Language, { native: string; code: string }> = {
  en: { native: 'English', code: 'EN' },
  kn: { native: 'ಕನ್ನಡ', code: 'KN' },
  hi: { native: 'हिन्दी', code: 'HI' },
};

export function translateCategory(dict: TranslationDict, category: string): string {
  return (dict.categories as Record<string, string>)[category] || category;
}

export function translateWorkType(dict: TranslationDict, workType: string): string {
  return (dict.workTypes as Record<string, string>)[workType] || workType;
}

export function translateExperience(dict: TranslationDict, exp: string): string {
  return (dict.experienceLevels as Record<string, string>)[exp] || exp;
}

export function translateEmployerType(dict: TranslationDict, empType: string): string {
  return (dict.employerTypes as Record<string, string>)[empType] || empType;
}

export function translateAppStatus(dict: TranslationDict, status: string): string {
  return (dict.appStatuses as Record<string, string>)[status] || status;
}

export function translateJobStatus(dict: TranslationDict, status: string): string {
  return (dict.jobStatuses as Record<string, string>)[status] || status;
}
