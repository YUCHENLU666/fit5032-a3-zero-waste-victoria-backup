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
  limit,
  query,
  setDoc,
  where,
} from 'firebase/firestore'

import {
  auth,
  db,
} from '../firebase'


// ======================================================
// Current authenticated user profile
// ======================================================
//
// Firebase Authentication stores the login session.
//
// Firestore stores extra application information such as:
// - username
// - role
// - createdAt
//
// We cache the combined user profile here so existing
// Vue components can access it synchronously after
// Firebase has finished restoring the session.
// ======================================================

let currentUserProfile = null

const authSubscribers =
  new Set()

let resolveAuthReady

const authReadyPromise =
  new Promise((resolve) => {
    resolveAuthReady = resolve
  })

let authReadyResolved = false


// ======================================================
// Notify components when authentication changes
// ======================================================

function notifyAuthSubscribers() {
  authSubscribers.forEach(
    (callback) => {
      callback(currentUserProfile)
    },
  )
}


// ======================================================
// Load application profile from Firestore
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
    await getDoc(profileReference)

  if (profileSnapshot.exists()) {
    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      ...profileSnapshot.data(),
    }
  }

  // Safe fallback in case an Authentication account
  // exists but its Firestore profile is missing.
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    username:
      firebaseUser.displayName ||
      'ZWV User',
    email:
      firebaseUser.email || '',
    role: 'user',
  }
}


// ======================================================
// Restore Firebase session when application starts
// ======================================================

onAuthStateChanged(
  auth,
  async (firebaseUser) => {
    try {
      currentUserProfile =
        firebaseUser
          ? await loadUserProfile(
              firebaseUser,
            )
          : null
    } catch (error) {
      console.error(
        'Failed to restore Firebase session:',
        error,
      )

      currentUserProfile = null
    }

    if (!authReadyResolved) {
      authReadyResolved = true
      resolveAuthReady()
    }

    notifyAuthSubscribers()
  },
)


// ======================================================
// Wait until Firebase knows whether the user is logged in
// ======================================================

export async function waitForAuthReady() {
  await authReadyPromise
}


// ======================================================
// Get current logged-in user
// ======================================================

export function getCurrentUser() {
  return currentUserProfile
}


// ======================================================
// Subscribe to login/logout changes
// ======================================================

export function subscribeToAuthState(
  callback,
) {
  authSubscribers.add(callback)

  callback(currentUserProfile)

  return () => {
    authSubscribers.delete(callback)
  }
}


// ======================================================
// Register a new user
// ======================================================

export async function registerUser(
  username,
  email,
  password,
) {
  const cleanUsername =
    username.trim()

  const cleanEmail =
    email.trim().toLowerCase()

  try {
    // ----------------------------------------------
    // Check whether this username already exists
    // ----------------------------------------------

    const usernameQuery =
      query(
        collection(db, 'users'),
        where(
          'usernameLower',
          '==',
          cleanUsername.toLowerCase(),
        ),
        limit(1),
      )

    const usernameSnapshot =
      await getDocs(usernameQuery)

    if (!usernameSnapshot.empty) {
      return {
        success: false,
        message:
          'Username already exists.',
      }
    }


    // ----------------------------------------------
    // Create Firebase Authentication account
    // ----------------------------------------------

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      )

    const firebaseUser =
      credential.user


    // ----------------------------------------------
    // Store display name in Firebase Authentication
    // ----------------------------------------------

    await updateProfile(
      firebaseUser,
      {
        displayName:
          cleanUsername,
      },
    )


    // ----------------------------------------------
    // Create user profile in Firestore
    // ----------------------------------------------

    const userProfile = {
      username:
        cleanUsername,

      usernameLower:
        cleanUsername.toLowerCase(),

      email:
        cleanEmail,

      role:
        'user',

      createdAt:
        new Date().toISOString(),
    }

    await setDoc(
      doc(
        db,
        'users',
        firebaseUser.uid,
      ),
      userProfile,
    )


    // Registration page currently sends users
    // to the Login page, so sign them out after
    // successfully creating their account.
    await signOut(auth)

    return {
      success: true,

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

    switch (error.code) {
      case 'auth/email-already-in-use':
        return {
          success: false,
          message:
            'Email already exists.',
        }

      case 'auth/invalid-email':
        return {
          success: false,
          message:
            'Please enter a valid email address.',
        }

      case 'auth/weak-password':
        return {
          success: false,
          message:
            'The password is too weak.',
        }

      case 'auth/network-request-failed':
        return {
          success: false,
          message:
            'Network error. Please try again.',
        }

      default:
        return {
          success: false,
          message:
            'Unable to create account. Please try again.',
        }
    }
  }
}


// ======================================================
// Login
// ======================================================

export async function loginUser(
  email,
  password,
) {
  const cleanEmail =
    email.trim().toLowerCase()

  try {
    const credential =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      )

    const profile =
      await loadUserProfile(
        credential.user,
      )

    currentUserProfile =
      profile

    notifyAuthSubscribers()

    return {
      success: true,
      user: profile,
    }
  } catch (error) {
    console.error(
      'Firebase login error:',
      error,
    )

    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return {
          success: false,
          message:
            'Invalid email or password.',
        }

      case 'auth/invalid-email':
        return {
          success: false,
          message:
            'Please enter a valid email address.',
        }

      case 'auth/user-disabled':
        return {
          success: false,
          message:
            'This account has been disabled.',
        }

      case 'auth/too-many-requests':
        return {
          success: false,
          message:
            'Too many login attempts. Please try again later.',
        }

      case 'auth/network-request-failed':
        return {
          success: false,
          message:
            'Network error. Please try again.',
        }

      default:
        return {
          success: false,
          message:
            'Unable to log in. Please try again.',
        }
    }
  }
}


// ======================================================
// Logout
// ======================================================

export async function logoutUser() {
  await signOut(auth)

  currentUserProfile = null

  notifyAuthSubscribers()
}


// ======================================================
// Authentication helpers
// ======================================================

export function isAuthenticated() {
  return currentUserProfile !== null
}


export function isAdmin() {
  return (
    currentUserProfile !== null &&
    currentUserProfile.role ===
      'admin'
  )
}


// ======================================================
// Load all user profiles
//
// Used by the administrator dashboard.
// Firestore security rules will later restrict this.
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