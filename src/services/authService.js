const USERS_KEY = 'zwvUsers'
const CURRENT_USER_KEY = 'zwvCurrentUser'


// ======================================================
// Generate random salt
// ======================================================

// Create a random 16-byte salt
// and convert it into a hexadecimal string.
function generateSalt() {
  const bytes = new Uint8Array(16)

  crypto.getRandomValues(bytes)

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, '0')
    )
    .join('')
}


// ======================================================
// Hash password using Web Crypto PBKDF2
// ======================================================

async function hashPassword(password, salt) {
  const encoder = new TextEncoder()

  // Convert password into bytes
  const passwordData = encoder.encode(password)

  // Import the password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    {
      name: 'PBKDF2',
    },
    false,
    ['deriveBits']
  )

  // Convert the hexadecimal salt back into bytes
  const saltBytes = new Uint8Array(
    salt.match(/.{1,2}/g).map(
      (byte) => parseInt(byte, 16)
    )
  )

  // Derive a password hash
  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    )

  const hashBytes =
    new Uint8Array(derivedBits)

  // Convert hash bytes into hexadecimal
  const hashParts =
    Array.from(hashBytes).map(
      (byte) =>
        byte.toString(16).padStart(2, '0')
    )

  return hashParts.join('')
}


// ======================================================
// Read all users from localStorage
// ======================================================

export function getUsers() {
  try {
    const storedUsers =
      localStorage.getItem(USERS_KEY)

    if (!storedUsers) {
      return []
    }

    return JSON.parse(storedUsers)
  } catch (error) {
    console.error(
      'Failed to load users:',
      error
    )

    return []
  }
}


// ======================================================
// Save all users to localStorage
// ======================================================

function saveUsers(users) {
  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  )
}


// ======================================================
// Get current logged-in user
// ======================================================

export function getCurrentUser() {
  try {
    const storedUser =
      localStorage.getItem(CURRENT_USER_KEY)

    if (!storedUser) {
      return null
    }

    // Treat zwvCurrentUser only as
    // session identity information.
    const sessionUser =
      JSON.parse(storedUser)

    // A valid session must contain a user id.
    if (!sessionUser?.id) {
      localStorage.removeItem(
        CURRENT_USER_KEY
      )

      return null
    }

    // Read the full account list.
    const users = getUsers()

    // Find the real account using
    // the id stored in the session.
    const realUser = users.find(
      (user) =>
        user.id === sessionUser.id
    )

    // If the account no longer exists,
    // the session is invalid.
    if (!realUser) {
      localStorage.removeItem(
        CURRENT_USER_KEY
      )

      return null
    }

    // Return safe account information
    // from zwvUsers.
    //
    // Do not trust role, username or email
    // stored inside zwvCurrentUser.
    return {
      id: realUser.id,
      username: realUser.username,
      email: realUser.email,
      role: realUser.role,
    }
  } catch (error) {
    console.error(
      'Failed to load current user:',
      error
    )

    // Remove invalid/corrupted session data.
    localStorage.removeItem(
      CURRENT_USER_KEY
    )

    return null
  }
}


// ======================================================
// Register new account
// ======================================================

export async function registerUser(
  username,
  email,
  password
) {
  const users = getUsers()

  const cleanUsername = username.trim()
  const cleanEmail =
    email.trim().toLowerCase()

  const usernameExists = users.some(
    (user) =>
      user.username.toLowerCase() ===
      cleanUsername.toLowerCase()
  )

  if (usernameExists) {
    return {
      success: false,
      message: 'Username already exists.'
    }
  }

  const emailExists = users.some(
    (user) =>
      user.email.toLowerCase() ===
      cleanEmail
  )

  if (emailExists) {
    return {
      success: false,
      message: 'Email already exists.'
    }
  }


  // Generate a unique random salt
  const passwordSalt = generateSalt()


  // Hash the password using the generated salt
  const passwordHash =
    await hashPassword(
      password,
      passwordSalt
    )


  const newUser = {
    id: crypto.randomUUID(),

    username: cleanUsername,

    email: cleanEmail,

    passwordSalt,

    passwordHash,

    role: 'user',

    createdAt:
      new Date().toISOString()
  }


  users.push(newUser)

  saveUsers(users)


  return {
    success: true,

    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
  }
}


// ======================================================
// Login
// ======================================================

export async function loginUser(
  email,
  password
) {
  const users = getUsers()

  const cleanEmail =
    email.trim().toLowerCase()


  const user = users.find(
    (item) =>
      item.email.toLowerCase() ===
      cleanEmail
  )


  // User does not exist
  if (!user) {
    return {
      success: false,
      message:
        'Invalid email or password.'
    }
  }


  // Account does not contain secure password fields
  if (
    !user.passwordSalt ||
    !user.passwordHash
  ) {
    return {
      success: false,
      message:
        'Invalid email or password.'
    }
  }


  // Hash the entered password using
  // this user's stored salt
  const enteredPasswordHash =
    await hashPassword(
      password,
      user.passwordSalt
    )


  // Compare entered hash with stored hash
  if (
    enteredPasswordHash !==
    user.passwordHash
  ) {
    return {
      success: false,
      message:
        'Invalid email or password.'
    }
  }


  // Only safe user information is stored
  // for the current login session.
  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  }


  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(safeUser)
  )


  return {
    success: true,
    user: safeUser
  }
}


// ======================================================
// Logout
// ======================================================

export function logoutUser() {
  localStorage.removeItem(
    CURRENT_USER_KEY
  )
}


// ======================================================
// Check whether someone is logged in
// ======================================================

export function isAuthenticated() {
  return getCurrentUser() !== null
}


// ======================================================
// Check administrator permission
// ======================================================

export function isAdmin() {
  const user = getCurrentUser()

  return (
    user !== null &&
    user.role === 'admin'
  )
}


// ======================================================
// Create demo administrator
// ======================================================

export async function initializeDefaultAdmin() {
  const users = getUsers()

  const adminEmail = 'admin@zwv.com'

  const existingAdmin = users.find(
    (user) =>
      user.email.toLowerCase() ===
      adminEmail
  )

  if (existingAdmin) {
    return
  }


  // Generate a unique random salt
  // for the administrator password
  const adminPasswordSalt =
    generateSalt()


  // Hash the administrator password
  const adminPasswordHash =
    await hashPassword(
      'Admin123!',
      adminPasswordSalt
    )


  const adminUser = {
    id: crypto.randomUUID(),

    username: 'ZWV Admin',

    email: adminEmail,

    passwordSalt:
      adminPasswordSalt,

    passwordHash:
      adminPasswordHash,

    role: 'admin',

    createdAt:
      new Date().toISOString()
  }


  users.push(adminUser)

  saveUsers(users)
}