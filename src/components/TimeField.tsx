// Metro always resolves `./TimeField` to TimeField.native.tsx (iOS/Android)
// or TimeField.web.tsx (web) before ever considering this file — this
// re-export exists only so `tsc`, which has no notion of platform
// extensions, can resolve `import { TimeField } from '../components/TimeField'`.
export * from './TimeField.native';
