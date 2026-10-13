import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
// - Login session
// - Email/password authentication
// - Firebase UID
//
// Cloud Firestore stores additional application data:
// - Username
// - Email
// - Role
// - Account creation date
//
// The combined user profile is cached here so that
// Vue components and Vue Router can access it after
// Firebase finishes restoring the login session.
// ======================================================

let currentUserProfile = null


// ======================================================
// Authentication subscribers
// ======================================================
//
// Components such as AppNavbar.vue and AccountView.vue
// subscribe to authentication changes.
//
// Whenever a user logs in or logs out, all subscribers
// are notified automatically.
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
// Firebase restores an existing login asynchronously.
//
// The router must wait for this process before deciding
// whether a protected page can be opened.
//
// Otherwise, refreshing /account or /admin could
// incorrectly redirect a logged-in user to /login.
// ======================================================

let resolveAuthReady

const authReadyPromise =
  new Promise((resolve) => {
    resolveAuthReady =
      resolve
  })

let authReadyResolved =
  false


// ======================================================
// Load Firestore profile
// ======================================================
//
// Firebase Authentication only provides identity data.
//
// Application-specific information such as username
// and role is stored in Firestore under:
//
// users/{firebaseUid}
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
  // Firestore profile exists
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
  //
  // This should rarely happen, but it prevents the
  // application from breaking if a Firebase Authentication
  // account exists without a matching Firestore profile.
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
// Restore Firebase login session
// ======================================================
//
// Firebase automatically remembers authenticated users.
//
// When the application starts, onAuthStateChanged()
// determines whether a valid session already exists.
// ======================================================

onAuthStateChanged(
  auth,

  async (firebaseUser) => {
    try {

      if (firebaseUser) {
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


    // Resolve only once:
    // Firebase has now checked the initial session.
    if (!authReadyResolved) {
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
//
// Returns an unsubscribe function so Vue components
// can stop listening when they are destroyed.
// ======================================================

export function subscribeToAuthState(
  callback,
) {
  authSubscribers.add(
    callback,
  )


  // Immediately provide the latest state.
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
// Register user
// ======================================================
//
// Registration process:
//
// 1. Clean user input.
// 2. Create Firebase Authentication account.
// 3. Store username as Firebase displayName.
// 4. Create Firestore application profile.
// 5. Every newly registered account receives role "user".
// 6. Sign the user out.
// 7. Registration page redirects to Login.
//
// Firebase Authentication already guarantees that
// email addresses are unique.
//
// Username uniqueness is intentionally not enforced
// by querying the complete users collection because
// unauthenticated users should not have permission
// to read all account profiles.
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
    // 1. Create Firebase Authentication account
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
    // 2. Store display name in Firebase Authentication
    // ==================================================

    await updateProfile(
      firebaseUser,
      {
        displayName:
          cleanUsername,
      },
    )


    // ==================================================
    // 3. Build Firestore profile
    // ==================================================
    //
    // Security rule will later enforce that newly
    // registered users MUST have role "user".
    //
    // This prevents clients from creating themselves
    // as administrators.
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


    // ==================================================
    // 4. Save Firestore profile
    // ==================================================

    await setDoc(
      doc(
        db,
        'users',
        firebaseUser.uid,
      ),

      userProfile,
    )


    // ==================================================
    // 5. Sign out after successful registration
    // ==================================================
    //
    // The existing RegisterView redirects users to
    // /login after successful account creation.
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
// Login user
// ======================================================
//
// Firebase Authentication verifies the email/password.
//
// After successful authentication, the corresponding
// application profile is loaded from Firestore.
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
// Logout user
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
// This function is used by AdminView.vue.
//
// Once the final Firestore Security Rules are enabled,
// only authenticated users with role "admin" will have
// permission to list the users collection.
//
// A normal account calling this function will receive
// a Firestore permission-denied error.
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
    (userDocument) => ({

      id:
        userDocument.id,

      ...userDocument.data(),
    }),
  )
}