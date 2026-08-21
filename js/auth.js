(function (window) {
  const STORAGE_KEY = 'securevault.currentUser';

  const DEMO_USER = {
    userId: 'demo-user-001',
    name: 'Demo User',
    email: 'demo@securevault.local',
    role: 'Owner',
    demoMode: true
  };

  function safeGetStorageValue() {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function safeSetStorageValue(value) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      return false;
    }
    return true;
  }

  function safeRemoveStorageValue() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      return false;
    }
    return true;
  }

  function getCurrentUser() {
    const storedValue = safeGetStorageValue();
    if (!storedValue) {
      return null;
    }

    try {
      return JSON.parse(storedValue);
    } catch (error) {
      return null;
    }
  }

  function isAuthenticated() {
    return Boolean(getCurrentUser());
  }

  function loginUser(credentials = {}) {
    const email = String(credentials.email || '').trim() || DEMO_USER.email;
    const name = credentials.name ? String(credentials.name).trim() : DEMO_USER.name;

    const user = {
      ...DEMO_USER,
      name,
      email,
      signedInAt: new Date().toISOString()
    };

    safeSetStorageValue(user);

    return {
      success: true,
      user,
      message: 'Signed in successfully in demo mode.'
    };
  }

  function logoutUser() {
    safeRemoveStorageValue();
    return {
      success: true,
      message: 'Signed out successfully.'
    };
  }

  function initAuthPage() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const message = document.getElementById('authMessage');
    const signInButton = document.getElementById('signInButton');
    const createAccountLink = document.getElementById('createAccountLink');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    if (!form) {
      return;
    }

    if (isAuthenticated()) {
      window.location.href = 'dashboard.html';
      return;
    }

    function setMessage(text, isError = false) {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.classList.toggle('error', isError);
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';

      signInButton.disabled = true;
      signInButton.textContent = 'Signing In...';
      setMessage('Signing in using demo authentication...');

      window.setTimeout(() => {
        loginUser({ email, password });
        setMessage('Login successful. Redirecting to your dashboard...');
        window.location.href = 'dashboard.html';
      }, 450);
    });

    if (createAccountLink) {
      createAccountLink.addEventListener('click', () => {
        setMessage('Account creation will be connected to Cognito in the next phase.');
      });
    }

    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', () => {
        setMessage('Password reset will be handled by Cognito later.');
      });
    }
  }

  window.SecureVaultAuth = {
    loginUser,
    logoutUser,
    getCurrentUser,
    isAuthenticated,
    initAuthPage,
    demoUser: DEMO_USER
  };
})(window);