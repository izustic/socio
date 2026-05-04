// Firebase Auth Error Code Mapping
export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  suggestion?: string;
}

export const getAuthErrorMessage = (error: any): AuthError => {
  const code = error?.code || 'unknown';
  const message = error?.message || 'An unknown error occurred';

  const errorMap: Record<string, AuthError> = {
    // Email/Password Errors
    'auth/email-already-in-use': {
      code: 'auth/email-already-in-use',
      message: 'The email address is already in use by another account.',
      userMessage: 'This email is already registered',
      suggestion: 'Try signing in instead, or use a different email'
    },
    'auth/invalid-email': {
      code: 'auth/invalid-email',
      message: 'The email address is not valid.',
      userMessage: 'Please enter a valid email address',
      suggestion: 'Check your email for typos'
    },
    'auth/user-disabled': {
      code: 'auth/user-disabled',
      message: 'The user account has been disabled.',
      userMessage: 'This account has been disabled',
      suggestion: 'Contact support for assistance'
    },
    'auth/user-not-found': {
      code: 'auth/user-not-found',
      message: 'There is no user record corresponding to this identifier.',
      userMessage: 'No account found with this email',
      suggestion: 'Check your email or create an account'
    },
    'auth/wrong-password': {
      code: 'auth/wrong-password',
      message: 'The password is invalid or the user does not have a password.',
      userMessage: 'Incorrect password',
      suggestion: 'Try again or reset your password'
    },
    'auth/weak-password': {
      code: 'auth/weak-password',
      message: 'The password is not strong enough.',
      userMessage: 'Password is too weak',
      suggestion: 'Use at least 8 characters with numbers and symbols'
    },
    'auth/too-many-requests': {
      code: 'auth/too-many-requests',
      message: 'We have blocked all requests from this device due to unusual activity.',
      userMessage: 'Too many failed attempts',
      suggestion: 'Please try again later'
    },
    'auth/network-request-failed': {
      code: 'auth/network-request-failed',
      message: 'A network error has occurred.',
      userMessage: 'Network connection failed',
      suggestion: 'Check your internet connection'
    },
    'auth/requires-recent-login': {
      code: 'auth/requires-recent-login',
      message: 'This operation is sensitive and requires recent authentication.',
      userMessage: 'Please sign in again to continue',
      suggestion: 'Sign out and sign back in'
    },
    'auth/invalid-credential': {
      code: 'auth/invalid-credential',
      message: 'The auth credential is malformed or has expired.',
      userMessage: 'Invalid authentication',
      suggestion: 'Try signing in again'
    },
    'auth/invalid-verification-code': {
      code: 'auth/invalid-verification-code',
      message: 'The SMS verification code used to create the phone auth credential is invalid.',
      userMessage: 'Invalid verification code',
      suggestion: 'Request a new code'
    },
    'auth/missing-verification-code': {
      code: 'auth/missing-verification-code',
      message: 'The phone auth credential was created with a missing verification code.',
      userMessage: 'Missing verification code',
      suggestion: 'Enter the code you received'
    },
    // OAuth Errors
    'auth/account-exists-with-different-credential': {
      code: 'auth/account-exists-with-different-credential',
      message: 'An account already exists with the same email address but different sign-in credentials.',
      userMessage: 'Email already used with different method',
      suggestion: 'Try the original sign-in method'
    },
    'auth/credential-already-in-use': {
      code: 'auth/credential-already-in-use',
      message: 'This credential is already associated with a different user account.',
      userMessage: 'Account already linked',
      suggestion: 'Try a different account'
    },
    'auth/operation-not-allowed': {
      code: 'auth/operation-not-allowed',
      message: 'The operation is not allowed.',
      userMessage: 'Operation not permitted',
      suggestion: 'Contact support'
    },
    'auth/expired-action-code': {
      code: 'auth/expired-action-code',
      message: 'The action code has expired.',
      userMessage: 'Code has expired',
      suggestion: 'Request a new code'
    },
    'auth/invalid-action-code': {
      code: 'auth/invalid-action-code',
      message: 'The action code is invalid.',
      userMessage: 'Invalid code',
      suggestion: 'Check the code and try again'
    },
    // Custom validation errors
    'auth/password-too-short': {
      code: 'auth/password-too-short',
      message: 'Password must be at least 6 characters.',
      userMessage: 'Password is too short',
      suggestion: 'Use at least 6 characters'
    },
    'auth/missing-fields': {
      code: 'auth/missing-fields',
      message: 'Email and password are required.',
      userMessage: 'Please fill in all fields',
      suggestion: 'Complete the form to continue'
    }
  };

  return errorMap[code] || {
    code,
    message,
    userMessage: 'Something went wrong',
    suggestion: 'Please try again'
  };
};

export const showErrorAlert = (error: any, context: string = 'Authentication') => {
  const authError = getAuthErrorMessage(error);
  
  console.error(`${context} error:`, {
    code: authError.code,
    message: authError.message,
    originalError: error
  });

  return {
    title: authError.userMessage,
    message: authError.suggestion ? `Hint: ${authError.suggestion}` : undefined,
    code: authError.code
  };
};
