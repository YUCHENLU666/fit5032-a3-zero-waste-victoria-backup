import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'

import {
  auth,
  db,
} from '../firebase'


// ======================================================
// Current authenticated user profile
// ======================================================
//
// Firebase Authentication manages:
//
// - Login sessions
// - Email/password authentication
// - Google authentication
// - Firebase UID
//
// Cloud Firestore stores application-specific data:
//
// - Username
// - Email
// - Role
// - Account creation date
//
// The combined profile is cached here so Vue components
// and Vue Router can access the current user.
// ======================================================

let currentUserProfile =
  null


// ======================================================
// Authentication subscribers
// ======================================================

const authSubscribers =
  new Set()


function notifyAuthSubscribers() {
  authSubscribers.forEach(
    (callback) => {
      callback(
        currentUserProfile,
      )
    },
  )
}


// ======================================================
// Firebase authentication readiness
// ======================================================
//
// Firebase restores an existing session asynchronously.
//
// Vue Router waits for this before deciding whether a
// protected route can be opened.
// ======================================================

let resolveAuthReady


const authReadyPromise =
  new Promise(
    (resolve) => {
      resolveAuthReady =
        resolve
    },
  )


let authReadyResolved =
  false


// ======================================================
// Load Firestore user profile
// ======================================================

async function loadUserProfile(
  firebaseUser,
) {
  if (!firebaseUser) {
    return null
  }


  const profileReference =
    doc(
      db,
      'users',
      firebaseUser.uid,
    )


  const profileSnapshot =
    await getDoc(
      profileReference,
    )


  // ------------------------------------------------------
  // Existing Firestore profile
  // ------------------------------------------------------

  if (
    profileSnapshot.exists()
  ) {
    return {
      id:
        firebaseUser.uid,

      uid:
        firebaseUser.uid,

      ...profileSnapshot.data(),
    }
  }


  // ------------------------------------------------------
  // Safe fallback
  // ------------------------------------------------------

  return {
    id:
      firebaseUser.uid,

    uid:
      firebaseUser.uid,

    username:
      firebaseUser.displayName ||
      'ZWV User',

    email:
      firebaseUser.email ||
      '',

    role:
      'user',
  }
}


// ======================================================
// Create Google user's Firestore profile when necessary
// ======================================================
//
// A user signing in with Google already exists in
// Firebase Authentication.
//
// However, on the first Google login there may not yet be
// a matching:
//
// users/{uid}
//
// Firestore document.
//
// This function creates that application profile using
// role "user".
//
// Existing profiles are NEVER overwritten. This is
// important because an existing administrator must keep
// their current role.
// ======================================================

async function ensureGoogleUserProfile(
  firebaseUser,
) {
  const profileReference =
    doc(
      db,
      'users',
      firebaseUser.uid,
    )


  const profileSnapshot =
    await getDoc(
      profileReference,
    )


  // ------------------------------------------------------
  // Existing application user
  // ------------------------------------------------------

  if (
    profileSnapshot.exists()
  ) {
    return {
      id:
        firebaseUser.uid,

      uid:
        firebaseUser.uid,

      ...profileSnapshot.data(),
    }
  }


  // ------------------------------------------------------
  // New Google user
  // ------------------------------------------------------

  const cleanEmail =
    (
      firebaseUser.email ||
      ''
    )
      .trim()
      .toLowerCase()


  if (!cleanEmail) {
    throw new Error(
      'Google did not provide an email address.',
    )
  }


  const fallbackUsername =
    cleanEmail
      .split('@')[0] ||
    'ZWV User'


  const cleanUsername =
    (
      firebaseUser.displayName ||
      fallbackUsername
    )
      .trim()


  const userProfile = {
    username:
      cleanUsername,

    usernameLower:
      cleanUsername
        .toLowerCase(),

    email:
      cleanEmail,

    role:
      'user',

    createdAt:
      new Date()
        .toISOString(),
  }


  // ------------------------------------------------------
  // Store the application profile
  // ------------------------------------------------------

  await setDoc(
    profileReference,
    userProfile,
  )


  return {
    id:
      firebaseUser.uid,

    uid:
      firebaseUser.uid,

    ...userProfile,
  }
}


// ======================================================
// Restore Firebase login session
// ======================================================

onAuthStateChanged(
  auth,

  async (
    firebaseUser,
  ) => {
    try {
      if (
        firebaseUser
      ) {
        currentUserProfile =
          await loadUserProfile(
            firebaseUser,
          )
      } else {
        currentUserProfile =
          null
      }
    } catch (error) {
      console.error(
        'Failed to restore Firebase session:',
        error,
      )


      currentUserProfile =
        null
    }


    // Resolve once after Firebase checks the initial
    // authentication state.
    if (
      !authReadyResolved
    ) {
      authReadyResolved =
        true

      resolveAuthReady()
    }


    notifyAuthSubscribers()
  },
)


// ======================================================
// Wait for Firebase session restoration
// ======================================================

export async function waitForAuthReady() {
  await authReadyPromise
}


// ======================================================
// Get current authenticated user
// ======================================================

export function getCurrentUser() {
  return currentUserProfile
}


// ======================================================
// Subscribe to authentication changes
// ======================================================

export function subscribeToAuthState(
  callback,
) {
  authSubscribers.add(
    callback,
  )


  callback(
    currentUserProfile,
  )


  return () => {
    authSubscribers.delete(
      callback,
    )
  }
}


// ======================================================
// Register user with email/password
// ======================================================
//
// Registration:
//
// 1. Create Firebase Authentication account.
// 2. Save Firebase display name.
// 3. Create Firestore application profile.
// 4. New accounts receive role "user".
// 5. Sign user out.
// ======================================================

export async function registerUser(
  username,
  email,
  password,
) {
  const cleanUsername =
    username.trim()


  const cleanEmail =
    email
      .trim()
      .toLowerCase()


  try {
    // ==================================================
    // 1. Firebase Authentication
    // ==================================================

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      )


    const firebaseUser =
      credential.user


    // ==================================================
    // 2. Firebase display name
    // ==================================================

    await updateProfile(
      firebaseUser,
      {
        displayName:
          cleanUsername,
      },
    )


    // ==================================================
    // 3. Firestore application profile
    // ==================================================

    const userProfile = {
      username:
        cleanUsername,

      usernameLower:
        cleanUsername
          .toLowerCase(),

      email:
        cleanEmail,

      role:
        'user',

      createdAt:
        new Date()
          .toISOString(),
    }


    await setDoc(
      doc(
        db,
        'users',
        firebaseUser.uid,
      ),

      userProfile,
    )


    // ==================================================
    // 4. Sign out after registration
    // ==================================================

    await signOut(
      auth,
    )


    return {
      success:
        true,

      user: {
        id:
          firebaseUser.uid,

        uid:
          firebaseUser.uid,

        ...userProfile,
      },
    }
  } catch (error) {
    console.error(
      'Firebase registration error:',
      error,
    )


    switch (
      error.code
    ) {
      case 'auth/email-already-in-use':
        return {
          success:
            false,

          message:
            'Email already exists.',
        }


      case 'auth/invalid-email':
        return {
          success:
            false,

          message:
            'Please enter a valid email address.',
        }


      case 'auth/weak-password':
        return {
          success:
            false,

          message:
            'The password is too weak.',
        }


      case 'auth/network-request-failed':
        return {
          success:
            false,

          message:
            'Network error. Please try again.',
        }


      case 'permission-denied':
        return {
          success:
            false,

          message:
            'Unable to create the user profile because database access was denied.',
        }


      default:
        return {
          success:
            false,

          message:
            'Unable to create account. Please try again.',
        }
    }
  }
}


// ======================================================
// Login with email/password
// ======================================================

export async function loginUser(
  email,
  password,
) {
  const cleanEmail =
    email
      .trim()
      .toLowerCase()


  try {
    // ==================================================
    // 1. Firebase Authentication
    // ==================================================

    const credential =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      )


    // ==================================================
    // 2. Load Firestore profile
    // ==================================================

    const profile =
      await loadUserProfile(
        credential.user,
      )


    // ==================================================
    // 3. Update local authentication state
    // ==================================================

    currentUserProfile =
      profile


    notifyAuthSubscribers()


    return {
      success:
        true,

      user:
        profile,
    }
  } catch (error) {
    console.error(
      'Firebase login error:',
      error,
    )


    switch (
      error.code
    ) {
      case 'auth/invalid-credential':

      case 'auth/user-not-found':

      case 'auth/wrong-password':
        return {
          success:
            false,

          message:
            'Invalid email or password.',
        }


      case 'auth/invalid-email':
        return {
          success:
            false,

          message:
            'Please enter a valid email address.',
        }


      case 'auth/user-disabled':
        return {
          success:
            false,

          message:
            'This account has been disabled.',
        }


      case 'auth/too-many-requests':
        return {
          success:
            false,

          message:
            'Too many login attempts. Please try again later.',
        }


      case 'auth/network-request-failed':
        return {
          success:
            false,

          message:
            'Network error. Please try again.',
        }


      case 'permission-denied':
        return {
          success:
            false,

          message:
            'Unable to access the user profile.',
        }


      default:
        return {
          success:
            false,

          message:
            'Unable to log in. Please try again.',
        }
    }
  }
}


// ======================================================
// Sign in with Google
// ======================================================
//
// Flow:
//
// 1. Open Firebase Google Sign-In popup.
// 2. User selects a Google account.
// 3. Firebase Authentication verifies the account.
// 4. Existing Firestore profile is reused, OR
//    a new role="user" profile is created.
// 5. Local authentication state is updated.
// ======================================================

export async function loginWithGoogle() {
  const provider =
    new GoogleAuthProvider()


  // Always allow the user to choose which Google
  // account to use. This is also useful during demos.
  provider.setCustomParameters({
    prompt:
      'select_account',
  })


  let googleFirebaseUser =
    null


  try {
    // ==================================================
    // 1. Google authentication popup
    // ==================================================

    const credential =
      await signInWithPopup(
        auth,
        provider,
      )


    googleFirebaseUser =
      credential.user


    // ==================================================
    // 2. Ensure Firestore application profile exists
    // ==================================================

    const profile =
      await ensureGoogleUserProfile(
        googleFirebaseUser,
      )


    // ==================================================
    // 3. Update local authentication state
    // ==================================================

    currentUserProfile =
      profile


    notifyAuthSubscribers()


    return {
      success:
        true,

      user:
        profile,
    }
  } catch (error) {
    console.error(
      'Google sign-in error:',
      error,
    )


    // --------------------------------------------------
    // If Google Authentication succeeded but creating
    // the Firestore application profile failed, sign out
    // again so the application is not left half logged in.
    // --------------------------------------------------

    if (
      googleFirebaseUser
    ) {
      try {
        await signOut(
          auth,
        )
      } catch (
        signOutError
      ) {
        console.error(
          'Unable to clean up failed Google sign-in:',
          signOutError,
        )
      }
    }


    switch (
      error.code
    ) {
      case 'auth/popup-closed-by-user':
        return {
          success:
            false,

          message:
            'Google sign-in was cancelled.',
        }


      case 'auth/cancelled-popup-request':
        return {
          success:
            false,

          message:
            'The Google sign-in request was cancelled.',
        }


      case 'auth/popup-blocked':
        return {
          success:
            false,

          message:
            'The Google sign-in popup was blocked by your browser. Please allow popups and try again.',
        }


      case 'auth/account-exists-with-different-credential':
        return {
          success:
            false,

          message:
            'An account already exists with this email using another sign-in method. Please log in using your existing method.',
        }


      case 'auth/unauthorized-domain':
        return {
          success:
            false,

          message:
            'Google sign-in is not authorised for this website domain.',
        }


      case 'auth/network-request-failed':
        return {
          success:
            false,

          message:
            'Network error. Please try again.',
        }


      case 'permission-denied':
        return {
          success:
            false,

          message:
            'Google authentication succeeded, but the application profile could not be created.',
        }


      default:
        return {
          success:
            false,

          message:
            error.message ||
            'Unable to sign in with Google. Please try again.',
        }
    }
  }
}


// ======================================================
// Logout
// ======================================================

export async function logoutUser() {
  await signOut(
    auth,
  )


  currentUserProfile =
    null


  notifyAuthSubscribers()
}


// ======================================================
// Authentication helper
// ======================================================

export function isAuthenticated() {
  return (
    currentUserProfile !==
    null
  )
}


// ======================================================
// Administrator helper
// ======================================================

export function isAdmin() {
  return (
    currentUserProfile !==
      null &&

    currentUserProfile.role ===
      'admin'
  )
}


// ======================================================
// Load all registered users
// ======================================================
//
// Used by AdminView.
//
// Firestore Security Rules determine whether the
// authenticated user is allowed to list all users.
// ======================================================

export async function getUsers() {
  const snapshot =
    await getDocs(
      collection(
        db,
        'users',
      ),
    )


  return snapshot.docs.map(
    (
      userDocument,
    ) => ({
      id:
        userDocument.id,

      ...userDocument.data(),
    }),
  )
}