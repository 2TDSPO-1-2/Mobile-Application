// Metro always resolves `./DateField` to DateField.native.tsx (iOS/Android)
// or DateField.web.tsx (web) before ever considering this file — this
// re-export exists only so `tsc`, which has no notion of platform
// extensions, can resolve `import { DateField } from '../components/DateField'`.
export * from './DateField.native';
