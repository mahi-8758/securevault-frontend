(function (window) {
  let userPool;

  function getUserPool() {
    if (userPool) {
      return userPool;
    }
    const config = window.SECUREVAULT_CONFIG || {};
    if (!window.AmazonCognitoIdentity || !config.userPoolId || !config.clientId) {
      throw new Error('Cognito authentication is not configured.');
    }
    userPool = new window.AmazonCognitoIdentity.CognitoUserPool({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId
    });
    return userPool;
  }

  function createCognitoUser(email) {
    return new window.AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: getUserPool() });
  }

  function getErrorMessage(error) {
    const messages = {
      UsernameExistsException: 'An account with this email already exists.',
      UserNotConfirmedException: 'Please confirm your email address before signing in.',
      NotAuthorizedException: 'The email or password is incorrect.',
      UserNotFoundException: 'The email or password is incorrect.',
      CodeMismatchException: 'The verification code is incorrect.',
      ExpiredCodeException: 'The verification code has expired. Request a new code.',
      InvalidPasswordException: 'Password does not meet the required security rules.',
      LimitExceededException: 'Too many attempts. Please try again later.'
    };
    return messages[error && error.code] || (error && error.message) || 'Something went wrong. Please try again.';
  }

  function signUpUser(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const attribute = new window.AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: normalizedEmail });
    return new Promise((resolve, reject) => {
      try {
        getUserPool().signUp(normalizedEmail, password, [attribute], null, (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          console.info('[SecureVault] Account created; email confirmation required.');
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function confirmUser(email, code) {
    return new Promise((resolve, reject) => {
      try {
        createCognitoUser(String(email || '').trim().toLowerCase()).confirmRegistration(code, true, (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          console.info('[SecureVault] Email confirmed.');
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function loginUser(email, password) {
    const authenticationDetails = new window.AmazonCognitoIdentity.AuthenticationDetails({
      Username: String(email || '').trim().toLowerCase(),
      Password: password
    });
    const user = createCognitoUser(authenticationDetails.getUsername());
    return new Promise((resolve, reject) => {
      user.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          console.info('[SecureVault] Sign-in succeeded.');
          resolve({ user, session, idToken: session.getIdToken().getJwtToken() });
        },
        onFailure: reject,
        newPasswordRequired: () => reject(new Error('A new password is required for this account.'))
      });
    });
  }

  function getCurrentUser() {
    try {
      return getUserPool().getCurrentUser();
    } catch (error) {
      return null;
    }
  }

  function getCurrentSession() {
    const user = getCurrentUser();
    if (!user) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      user.getSession((error, session) => resolve(!error && session && session.isValid() ? session : null));
    });
  }

  async function isAuthenticated() {
    return Boolean(await getCurrentSession());
  }

  async function getIdToken() {
    const session = await getCurrentSession();
    return session ? session.getIdToken().getJwtToken() : null;
  }

  function logoutUser() {
    const currentUser = getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    console.info('[SecureVault] Signed out.');
    return { success: true, message: 'Signed out successfully.' };
  }

  function setMessage(element, text, isError) {
    if (element) {
      element.textContent = text;
      element.classList.toggle('error', Boolean(isError));
    }
  }

  function showAuthForm(form, visible) {
    if (form) {
      form.hidden = !visible;
    }
  }

  async function initAuthPage() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const confirmForm = document.getElementById('confirmForm');
    const authMessage = document.getElementById('authMessage');
    const signupMessage = document.getElementById('signupMessage');
    const confirmMessage = document.getElementById('confirmMessage');
    if (!loginForm) {
      return;
    }
    if (await isAuthenticated()) {
      window.location.href = 'dashboard.html';
      return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signInButton = document.getElementById('signInButton');
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      signInButton.disabled = true;
      signInButton.textContent = 'Signing In...';
      setMessage(authMessage, 'Signing in securely...');
      try {
        await loginUser(emailInput.value, passwordInput.value);
        setMessage(authMessage, 'Login successful. Redirecting to your dashboard...');
        window.location.href = 'dashboard.html';
      } catch (error) {
        setMessage(authMessage, getErrorMessage(error), true);
        signInButton.disabled = false;
        signInButton.textContent = 'Sign In';
      }
    });

    document.getElementById('createAccountLink').addEventListener('click', () => {
      showAuthForm(loginForm, false);
      showAuthForm(signupForm, true);
      setMessage(authMessage, '');
    });
    document.getElementById('backToLoginLink').addEventListener('click', () => {
      showAuthForm(signupForm, false);
      showAuthForm(confirmForm, false);
      showAuthForm(loginForm, true);
    });
    document.getElementById('forgotPasswordLink').addEventListener('click', () => {
      setMessage(authMessage, 'Password reset is not enabled for this phase.');
    });

    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;
      const signUpButton = document.getElementById('signUpButton');
      if (password !== confirmPassword) {
        setMessage(signupMessage, 'Passwords do not match.', true);
        return;
      }
      signUpButton.disabled = true;
      setMessage(signupMessage, 'Creating your account...');
      try {
        await signUpUser(email, password);
        document.getElementById('confirmEmail').value = email;
        showAuthForm(signupForm, false);
        showAuthForm(confirmForm, true);
        setMessage(confirmMessage, 'Check your email for the verification code.');
      } catch (error) {
        setMessage(signupMessage, getErrorMessage(error), true);
        signUpButton.disabled = false;
      }
    });

    confirmForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const confirmButton = document.getElementById('confirmButton');
      confirmButton.disabled = true;
      setMessage(confirmMessage, 'Confirming your account...');
      try {
        await confirmUser(document.getElementById('confirmEmail').value, document.getElementById('confirmationCode').value.trim());
        showAuthForm(confirmForm, false);
        showAuthForm(loginForm, true);
        setMessage(authMessage, 'Email confirmed. You can now sign in.');
      } catch (error) {
        setMessage(confirmMessage, getErrorMessage(error), true);
        confirmButton.disabled = false;
      }
    });
  }

  window.SecureVaultAuth = {
    signUpUser,
    confirmUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getCurrentSession,
    getIdToken,
    isAuthenticated,
    initAuthPage
  };
})(window);