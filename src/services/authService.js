// authService.js
// Simple server-side authentication simulation with localStorage

// Hash function for password (in a real app, use bcrypt on the server)
const hashPassword = (password) => {
  // Simple hash for demonstration purposes only - not for production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// Simulated server-side user database
const getUserDatabase = () => {
  const usersJSON = localStorage.getItem('ai_portal_users');
  return usersJSON ? JSON.parse(usersJSON) : {};
};

const saveUserDatabase = (users) => {
  localStorage.setItem('ai_portal_users', JSON.stringify(users));
};

// Register a new user
export const registerUser = (username, password) => {
  return new Promise((resolve, reject) => {
    // Simulate server processing time
    setTimeout(() => {
      const users = getUserDatabase();
      
      // Check if user already exists
      if (users[username]) {
        reject(new Error('Username already exists'));
        return;
      }
      
      // Create new user with hashed password
      const hashedPassword = hashPassword(password);
      users[username] = {
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'light',
          fontSize: 'medium',
          sendWithEnter: true,
          showTimestamps: true,
          showModelIcons: true,
          messageAlignment: 'left',
          codeHighlighting: true,
          openaiApiKey: '',
          anthropicApiKey: '',
          googleApiKey: ''
        }
      };
      
      saveUserDatabase(users);
      
      // Set session token (without password)
      const user = { ...users[username] };
      delete user.password;
      
      // Store in session storage (will be cleared when browser is closed)
      sessionStorage.setItem('ai_portal_current_user', JSON.stringify(user));
      
      resolve(user);
    }, 500); // Simulate network delay
  });
};

// Login user
export const loginUser = (username, password) => {
  return new Promise((resolve, reject) => {
    // Simulate server processing time
    setTimeout(() => {
      const users = getUserDatabase();
      const user = users[username];
      
      // Check if user exists
      if (!user) {
        reject(new Error('Invalid username or password'));
        return;
      }
      
      // Check password
      if (user.password !== hashPassword(password)) {
        reject(new Error('Invalid username or password'));
        return;
      }
      
      // Create a clean user object without password
      const cleanUser = { ...user };
      delete cleanUser.password;
      
      // Store in session storage (will be cleared when browser is closed)
      sessionStorage.setItem('ai_portal_current_user', JSON.stringify(cleanUser));
      
      resolve(cleanUser);
    }, 500); // Simulate network delay
  });
};

// Logout user
export const logoutUser = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      sessionStorage.removeItem('ai_portal_current_user');
      resolve(true);
    }, 200);
  });
};

// Check if user is logged in
export const getCurrentUser = () => {
  const userJSON = sessionStorage.getItem('ai_portal_current_user');
  return userJSON ? JSON.parse(userJSON) : null;
};

// Update user settings
export const updateUserSettings = (username, newSettings) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUserDatabase();
      const user = users[username];
      
      if (!user) {
        reject(new Error('User not found'));
        return;
      }
      
      // Update settings
      user.settings = { ...user.settings, ...newSettings };
      saveUserDatabase(users);
      
      // Update session
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.username === username) {
        currentUser.settings = user.settings;
        sessionStorage.setItem('ai_portal_current_user', JSON.stringify(currentUser));
      }
      
      resolve(user.settings);
    }, 300);
  });
};