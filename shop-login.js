import { isSupabaseConfigured, requireSupabase } from "./supabase.js";

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('loginForm');
  const card = document.getElementById('loginCard');
  const alertBox = document.getElementById('alertBox');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const setAlert = (message, type) => {
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    alertBox.textContent = message;
  };

  if (!isSupabaseConfigured) {
    setAlert('Supabase is not configured yet. Add your project URL and anon key in supabase.js.', 'error');
    return;
  }

  const supabase = requireSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData.session) {
    window.location.href = 'shopkeeper.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (error) {
      console.error("Supabase login failed: ", error);
      setAlert(error.message || 'Login failed. Please try again.', 'error');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 600);
      return;
    }

    setAlert('Login successful! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = 'shopkeeper.html';
    }, 800);
  });
});
