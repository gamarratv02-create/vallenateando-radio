// ======================================================
// VALLENATEANDO RADIO
// PANEL ADMINISTRATIVO
// ======================================================

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ======================================================
// ELEMENTOS
// ======================================================

const loginScreen = document.getElementById("loginScreen");
const adminScreen = document.getElementById("adminScreen");

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginMessage = document.getElementById("loginMessage");

const showPassword = document.getElementById("showPassword");

const logoutButton = document.getElementById("logoutButton");
const userEmail = document.getElementById("userEmail");


// ======================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ======================================================

if (showPassword) {

  showPassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

      passwordInput.type = "text";

      showPassword.textContent = "🙈";

    } else {

      passwordInput.type = "password";

      showPassword.textContent = "👁️";

    }

  });

}


// ======================================================
// MENSAJES
// ======================================================

function showMessage(message, type = "error") {

  loginMessage.textContent = message;

  loginMessage.className =
    "login-message " + type;

}


// ======================================================
// MOSTRAR LOGIN
// ======================================================

function showLogin() {

  loginScreen.classList.remove("hidden");

  adminScreen.classList.add("hidden");

}


// ======================================================
// MOSTRAR PANEL
// ======================================================

function showAdmin(session) {

  loginScreen.classList.add("hidden");

  adminScreen.classList.remove("hidden");

  if (session && session.user) {

    userEmail.textContent =
      session.user.email || "";

  }

}


// ======================================================
// INICIAR SESIÓN
// ======================================================

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = emailInput.value.trim();

  const password = passwordInput.value;

  if (!email || !password) {

    showMessage(
      "Ingresa tu correo y contraseña."
    );

    return;
  }


  loginButton.disabled = true;

  loginButton.textContent =
    "Iniciando sesión...";

  showMessage("", "");


  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

      });


    if (error) {

      console.error(error);

      showMessage(
        "Correo o contraseña incorrectos.",
        "error"
      );

      loginButton.disabled = false;

      loginButton.textContent =
        "Iniciar sesión";

      return;
    }


    if (data.session) {

      showAdmin(data.session);

    }

  } catch (error) {

    console.error(error);

    showMessage(
      "Ocurrió un error al iniciar sesión.",
      "error"
    );

  }


  loginButton.disabled = false;

  loginButton.textContent =
    "Iniciar sesión";

});


// ======================================================
// CERRAR SESIÓN
// ======================================================

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      const { error } =
        await supabaseClient.auth.signOut();

      if (error) {

        alert(
          "No se pudo cerrar la sesión."
        );

        return;
      }

      showLogin();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

}


// ======================================================
// COMPROBAR SESIÓN AL ABRIR LA PÁGINA
// ======================================================

async function checkSession() {

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();


  if (error) {

    console.error(error);

    showLogin();

    return;
  }


  if (data.session) {

    showAdmin(data.session);

  } else {

    showLogin();

  }

}


// ======================================================
// CAMBIOS DE SESIÓN
// ======================================================

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    if (session) {

      showAdmin(session);

    } else {

      showLogin();

    }

  }
);


// ======================================================
// INICIAR
// ======================================================

checkSession();
