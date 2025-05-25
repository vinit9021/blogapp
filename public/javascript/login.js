const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('password');

if (togglePassword && passwordField) {
  togglePassword.addEventListener('click', () => {
    const isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';

    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
  });
}