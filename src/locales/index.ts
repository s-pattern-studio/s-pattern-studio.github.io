import { en } from './en';
import { zhTW } from './zh-TW';
import type { Locale } from '../lib/model';
export const messages = { 'zh-TW': zhTW, en } satisfies Record<Locale, typeof en>;
