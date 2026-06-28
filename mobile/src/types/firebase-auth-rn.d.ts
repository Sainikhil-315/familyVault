// firebase/auth exports getReactNativePersistence in its react-native bundle (dist/rn/index.js)
// but TypeScript resolves the browser "types" key first, hiding it.
// This augmentation restores the missing export for type-checking.
import { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: object): Persistence;
}
