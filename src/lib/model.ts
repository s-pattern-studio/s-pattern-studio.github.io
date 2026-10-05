export const locales = ['zh-TW', 'en'] as const;
export type Locale = typeof locales[number];
export const localeConfig: Record<Locale, { label: string; htmlLang: string }> = {
  'zh-TW': { label: '繁中', htmlLang: 'zh-Hant' },
  en: { label: 'EN', htmlLang: 'en' },
};
export type Localized<T> = { 'zh-TW': T } & Partial<Record<Locale, T>>;
export const sections = ['work', 'studio', 'records', 'books', 'memories', 'contact'] as const;
export type Section = typeof sections[number];
export type Period = 'auto' | 'dawn' | 'day' | 'dusk' | 'night';
export const periods: Period[] = ['auto', 'dawn', 'day', 'dusk', 'night'];
export function localize<T>(value: Localized<T>, locale: Locale): T { return value[locale] ?? value['zh-TW']; }
export function readRoute(hash: string, preferred: string | null = null): { locale: Locale; section: Section | null } {
  const [language, section] = hash.replace(/^#\/?/, '').split('/');
  const locale = locales.includes(language as Locale) ? language as Locale : locales.includes(preferred as Locale) ? preferred as Locale : 'zh-TW';
  return { locale, section: sections.includes(section as Section) ? section as Section : null };
}
export function safeRead(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
export function safeWrite(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* private browsing still works */ } }

const stops = [
  { hour: 0, sky: '#28354c', ambient: 0.55, sun: 0.45, lamp: 1.0 },
  { hour: 6, sky: '#8f9ba6', ambient: 1.0, sun: 1.4, lamp: 0.45 },
  { hour: 12, sky: '#bec9cb', ambient: 1.7, sun: 2.7, lamp: 0.12 },
  { hour: 18, sky: '#ac7758', ambient: 0.9, sun: 1.6, lamp: 0.8 },
  { hour: 22, sky: '#28354c', ambient: 0.55, sun: 0.45, lamp: 1.0 },
  { hour: 24, sky: '#28354c', ambient: 0.55, sun: 0.45, lamp: 1.0 },
];
export function lightingAt(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const i = stops.findIndex((stop, index) => index < stops.length - 1 && h >= stop.hour && h < stops[index + 1].hour);
  const a = stops[Math.max(0, i)], b = stops[Math.max(0, i) + 1];
  const t = (h - a.hour) / (b.hour - a.hour);
  return { a, b, t, ambient: a.ambient + (b.ambient - a.ambient) * t, sun: a.sun + (b.sun - a.sun) * t, lamp: a.lamp + (b.lamp - a.lamp) * t };
}
export function periodHour(period: Period, now: Date) {
  return period === 'auto' ? now.getHours() + now.getMinutes() / 60 : { dawn: 6, day: 12, dusk: 18, night: 23 }[period];
}

export const studioContact: { email: string | null; github: string } = { email: null, github: 'https://github.com/s-pattern-studio' };
export const memories: { id: string; title: Localized<string>; category: Localized<string>; text: Localized<string>; point: [number, number] }[] = [
  { id: 'canada', title: { 'zh-TW': '加拿大', en: 'Canada' }, category: { 'zh-TW': '實習經歷', en: 'Internship' }, text: { 'zh-TW': '在不同的環境裡工作、生活，帶回新的視野。詳細故事與照片即將整理。', en: 'Working and living in a different environment. Stories and photographs will be added here.' }, point: [23, 29] },
  { id: 'shanghai', title: { 'zh-TW': '上海', en: 'Shanghai' }, category: { 'zh-TW': '交換生活', en: 'Exchange' }, text: { 'zh-TW': '一段交換生活，也是探索城市與自己的過程。詳細故事與照片即將整理。', en: 'An exchange chapter, exploring a city and finding new perspectives. Stories and photographs to come.' }, point: [82, 42] },
  { id: 'suzhou', title: { 'zh-TW': '蘇州', en: 'Suzhou' }, category: { 'zh-TW': '旅行收藏', en: 'Travel notes' }, text: { 'zh-TW': '一面經典電影海報牆，成為這間工作室的靈感起點之一。', en: 'A wall of classic movie posters became one of the starting points for this studio.' }, point: [81, 38] },
];
