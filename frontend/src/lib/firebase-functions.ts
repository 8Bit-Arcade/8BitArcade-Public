// Separate file for Firebase Functions to avoid bundling undici in pages that don't need it
import { getFunctions, httpsCallable, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { app } from './firebase';

let functions: Functions | null = null;

export function getFirebaseFunctions(): Functions {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Functions can only be used in the browser');
  }

  if (!functions) {
    functions = getFunctions(app);

    // Connect to emulator if configured
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
  }

  return functions;
}

export { httpsCallable };
