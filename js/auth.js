import { Store } from './store.js';

export const AuthModule = {
    render() {
        const hash = window.location.hash;
        if (hash === '#register') return this.renderRegister();
        return this.renderLogin();
    },
    renderLogin() {
        return `
            <div class="auth-container fade-in">
                <div class="auth-card">
                    <img src="logo.png" class="auth-logo" alt="Logo">
                    <h2 class="auth-title">Bienvenido</h2>
                    <p class="auth-subtitle">Inicie sesión para acceder a su CRM</p>
                    <form id="login-form">
                        <div class="form-group">
                            <label>Correo Electrónico</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                        <div class="form-group">
                            <label>Contraseña</label>
                            <input type="password" class="form-control" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:1rem;">Entrar</button>
                    </form>
                    <div class="auth-footer" style="margin-top: 2rem;">
                        <p>¿No tienes cuenta? <a href="#register" class="auth-link">Crear Administrador Maestro</a></p>
                    </div>
                </div>
            </div>
        `;
    },
    renderRegister() {
        return `
            <div class="auth-container fade-in">
                <div class="auth-card">
                    <img src="logo.png" class="auth-logo" alt="Logo">
                    <h2 class="auth-title">Configuración Inicial</h2>
                    <p class="auth-subtitle">Cree su cuenta de Admin en la nube</p>
                    <form id="register-form">
                        <div class="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" class="form-control" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>Correo Electrónico</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                        <div class="form-group">
                            <label>Contraseña</label>
                            <input type="password" class="form-control" name="password" minlength="6" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:1rem;">Crear Cuenta</button>
                    </form>
                    <div class="auth-footer" style="margin-top: 2rem;">
                        <p>¿Ya tienes cuenta? <a href="#login" class="auth-link">Iniciar Sesión</a></p>
                    </div>
                </div>
            </div>
        `;
    },
    init() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm) {
            loginForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const result = await Store.login(formData.get('email'), formData.get('password'));
                if (result.success) window.location.hash = '#dashboard';
                else alert(`Error: ${result.message}`);
            };
        }

        if (registerForm) {
            registerForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const result = await Store.registerUser({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    role: 'Super Admin'
                });
                if (result.success) {
                    alert('¡Cuenta creada con éxito! Ahora puedes entrar.');
                    window.location.hash = '#login';
                } else {
                    alert(`Error al crear cuenta: ${result.message}`);
                }
            };
        }
    }
};
