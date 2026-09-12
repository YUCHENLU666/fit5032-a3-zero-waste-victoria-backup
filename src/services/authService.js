const USERS_KEY = 'zwvUsers'
const CURRENT_USER_KEY = 'zwvCurrentUser'

// Read all users from localStorage
export function getUsers() {
  try {
    const storedUsers = localStorage.getItem(USERS_KEY)

    if (!storedUsers) {
      return []
    }

    // TODO 1:
    // Parse storedUsers from JSON and return the result
    return JSON.parse(storedUsers)
  } catch (error) {
    console.error('Failed to load users:', error)
    return []
  }
}

// Save all users to localStorage
function saveUsers(users) {
  // TODO 2:
  // Convert users into JSON and save using USERS_KEY
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Get current logged-in user
export function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY)

    if (!storedUser) {
      return null
    }

    // TODO 3:
    // Parse storedUser and return it
    return JSON.parse(storedUser)
  } catch (error) {
    console.error('Failed to load current user:', error)
    return null
  }
}

// Register new account
export async function registerUser(username, email, password) {
  const users = getUsers()

  const cleanUsername = username.trim()
  const cleanEmail = email.trim().toLowerCase()

  const usernameExists = users.some(
    (user) => user.username.toLowerCase() === cleanUsername.toLowerCase()
  )

  if (usernameExists) {
    return {
      success: false,
      message: 'Username already exists.'
    }
  }

  const emailExists = users.some(
    (user) => user.email.toLowerCase() === cleanEmail
  )

  if (emailExists) {
    return {
      success: false,
      message: 'Email already exists.'
    }
  }

  const newUser = {
    id: crypto.randomUUID(),

    username: cleanUsername,

    email: cleanEmail,

    // TODO 4:
    // Store the password value for now.
    // Later C.4 will replace this with a safer passwordHash approach.
    password: password,

    role: 'user',

    createdAt: new Date().toISOString()
  }

  users.push(newUser)

  // TODO 5:
  // Save the updated users array
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

// Login
export async function loginUser(email, password) {
  const users = getUsers()

  const cleanEmail = email.trim().toLowerCase()

  const user = users.find(
    (item) => item.email.toLowerCase() === cleanEmail
  )

  // TODO 6:
  // Check:
  // 1. user exists
  // 2. entered password matches stored password
  if (!user || user.password !== password) {
    return {
      success: false,
      message: 'Invalid email or password.'
    }
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  }

  // TODO 7:
  // Save safeUser to CURRENT_USER_KEY
  //
  // Important:
  // Do NOT save the user's password into zwvCurrentUser
  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(safeUser)
  )

  return {
    success: true,
    user: safeUser
  }
}

// Logout
export function logoutUser() {
  // TODO 8:
  // Remove CURRENT_USER_KEY from localStorage
  localStorage.removeItem(CURRENT_USER_KEY)
}

// Check whether someone is logged in
export function isAuthenticated() {
  // TODO 9:
  // Return true when getCurrentUser() is not null
  return getCurrentUser() !== null
}

// Check administrator permission
export function isAdmin() {
  const user = getCurrentUser()

  // TODO 10:
  // Return true only when:
  // user exists
  // AND user.role === 'admin'
  return user !== null && user.role === 'admin'
}

// Create demo administrator
export async function initializeDefaultAdmin() {
  const users = getUsers()

  const adminEmail = 'admin@zwv.com'

  const existingAdmin = users.find(
    (user) => user.email.toLowerCase() === adminEmail
  )

  if (existingAdmin) {
    return
  }

  const adminUser = {
    id: crypto.randomUUID(),

    username: 'ZWV Admin',

    email: adminEmail,

    // TODO 11:
    // Choose your own demo password here.
    // For C.4 we will improve the password handling.
    password: 'Admin123!',

    role: 'admin',

    createdAt: new Date().toISOString()
  }

  users.push(adminUser)

  // TODO 12:
  // Save the users array
  saveUsers(users)
}