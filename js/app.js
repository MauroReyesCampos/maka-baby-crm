import { Store } from './store.js';
import { ClientsModule } from './clients.js';
import { UsersModule } from './users.js';
import { SalesModule } from './sales.js?v=2';
import { AuthModule } from './auth.js?v=2';

const App = {
    init() {
        this.contentArea = document.getElementById('content-area');
        this.pageTitle = document.getElementById('page-title');
        this.addBtn = document.getElementById('add-btn');
        this.sidebar = document.querySelector('.sidebar');
        this.mainNav = document.getElementById('main-nav');
        this.userInfo = document.getElementById('user-info');

        window.onhashchange = () => this.handleRoute();
        Store.subscribe(() => this.render());

        // Mobile Menu Logic
        document.addEventListener('click', (e) => {
            if (e.target.id === 'menu-toggle') {
                document.querySelector('.sidebar').classList.toggle('active');
            } else if (!e.target.closest('.sidebar') && document.querySelector('.sidebar.active')) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });

        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash || '#dashboard';
        const user = Store.state.currentUser;
        if (!user && !['#login', '#register'].includes(hash)) { window.location.hash = '#login'; return; }
        if (user && ['#login', '#register'].includes(hash)) { window.location.hash = '#dashboard'; return; }
        Store.setRoute(hash);
        this.render();
    },

    render() {
        const hash = Store.state.currentRoute;
        const user = Store.state.currentUser;

        if (!user) {
            if (this.sidebar) this.sidebar.style.display = 'none';
            document.querySelector('.main-content').style.marginLeft = '0';
            this.contentArea.innerHTML = AuthModule.render();
            AuthModule.init();
            return;
        }

        if (this.sidebar) this.sidebar.style.display = 'flex';
        document.querySelector('.main-content').style.marginLeft = (window.innerWidth > 900) ? '260px' : '0';
        this.renderSidebar();

        // Show/Hide Add Button
        const showAddBtn = ['#clients', '#sales'].includes(hash) || (hash === '#users' && user.role === 'Super Admin');
        this.addBtn.style.display = showAddBtn ? 'flex' : 'none';

        if (hash === '#clients') this.addBtn.innerText = '+ Nuevo Cliente';
        else if (hash === '#users') this.addBtn.innerText = '+ Nuevo Usuario';
        else if (hash === '#sales') this.addBtn.innerText = '+ Nueva Venta';

        switch (hash) {
            case '#clients':
                this.pageTitle.innerText = 'Clientes';
                this.contentArea.innerHTML = ClientsModule.render();
                ClientsModule.init();
                break;
            case '#sales':
                this.pageTitle.innerText = 'Ventas';
                this.contentArea.innerHTML = SalesModule.render();
                SalesModule.init();
                break;
            case '#users':
                this.pageTitle.innerText = 'Usuarios';
                this.contentArea.innerHTML = UsersModule.render();
                UsersModule.init();
                break;
            case '#settings':
                this.pageTitle.innerText = 'Perfil';
                this.renderSettings();
                break;
            default:
                this.pageTitle.innerText = 'Dashboard';
                this.renderDashboard();
                break;
        }
    },

    renderSidebar() {
        const user = Store.state.currentUser;
        const hash = Store.state.currentRoute;

        // Ensure role allows 'Super Admin' or 'Admin' access to certain things if needed, 
        // but typically 'Users' is restricted. Note that currently 'users.js' allows 'Admin' to see. 
        // My task says "Users not appearing". If I fix the route, they will appear.
        // But the sidebar link only shows if user.role === 'Super Admin' in index.html.
        // I will keep that restriction for the SIDEBAR item as per original code.

        this.mainNav.innerHTML = `
            <a href="#dashboard" class="nav-item ${hash === '#dashboard' ? 'active' : ''}"><span class="nav-icon">📊</span><span class="nav-label">Dashboard</span></a>
            <a href="#clients" class="nav-item ${hash === '#clients' ? 'active' : ''}"><span class="nav-icon">👤</span><span class="nav-label">Clientes</span></a>
            <a href="#sales" class="nav-item ${hash === '#sales' ? 'active' : ''}"><span class="nav-icon">💰</span><span class="nav-label">Ventas</span></a>
            ${user.role === 'Super Admin' ? `
                <a href="#users" class="nav-item ${hash === '#users' ? 'active' : ''}"><span class="nav-icon">👥</span><span class="nav-label">Usuarios</span></a>
            ` : ''}
            <a href="#settings" class="nav-item ${hash === '#settings' ? 'active' : ''}"><span class="nav-icon">⚙️</span><span class="nav-label">Perfil</span></a>
            <a href="#" id="logout-btn" class="nav-item" style="margin-top: auto; color: var(--danger);"><span class="nav-icon">🚪</span><span class="nav-label">Cerrar Sesión</span></a>
        `;

        this.userInfo.innerHTML = `
            <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <span class="user-name">${user.name}</span>
                <span class="user-role">${user.role}</span>
            </div>
        `;

        document.getElementById('logout-btn').onclick = (e) => {
            e.preventDefault();
            if (confirm('¿Deseas cerrar sesión?')) {
                Store.logout();
                window.location.hash = '#login';
            }
        };
    },

    renderSettings() {
        const user = Store.state.currentUser;
        this.contentArea.innerHTML = `
            <div class="card fade-in" style="max-width: 600px; margin: 0 auto;">
                <h2 style="margin-bottom: 2rem; color: var(--primary);">Mi Perfil</h2>
                <form id="profile-form">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" class="form-control" name="name" value="${user.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Correo Electrónico Real</label>
                        <input type="email" class="form-control" name="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Nueva Contraseña</label>
                        <input type="password" class="form-control" name="password" placeholder="Solo si deseas cambiarla">
                    </div>
                    <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </form>

                <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--danger); opacity: 0.8;">
                    <h3 style="color: var(--danger); margin-bottom: 1rem;">Zona de Peligro</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                        Esta acción eliminará permanentemente todos los clientes y ventas de la base de datos y de este dispositivo.
                    </p>
                    <button id="wipe-data-btn" class="btn btn-ghost" style="color: var(--danger); border-color: var(--danger);">
                        🗑️ Eliminar Toda la Información
                    </button>
                </div>
            </div>
        `;

        const wipeBtn = document.getElementById('wipe-data-btn');
        if (wipeBtn) {
            wipeBtn.onclick = async () => {
                if (confirm('¿ESTÁS SEGURO? Esta acción borrará TODOS los clientes y ventas permanentemente.')) {
                    const result = await Store.wipeAllData();
                    if (result.success) {
                        alert('Todos los datos han sido eliminados con éxito.');
                        window.location.reload();
                    } else {
                        alert('Error al eliminar datos: ' + result.error);
                    }
                }
            };
        }

        const form = document.getElementById('profile-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const update = { name: data.name, email: data.email };
            if (data.password) update.password = data.password;

            if (await Store.updateCurrentUser(update)) {
                alert('¡Perfil actualizado con éxito!');
            }
        };
    },

    renderDashboard() {
        const sales = Store.state.sales || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthSales = sales.filter(s => {
            const date = new Date(s.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const yearSales = sales.filter(s => {
            const date = new Date(s.date);
            return date.getFullYear() === currentYear;
        });

        const monthTotal = monthSales.filter(s => s.paid).reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
        const pendingTotal = monthSales.filter(s => !s.paid).reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
        const yearTotal = yearSales.filter(s => s.paid).reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);

        this.contentArea.innerHTML = `
            <div class="dashboard-grid fade-in">
                <div class="card stat-card">
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Ventas del Mes (Cant.)</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--secondary);">${monthSales.length}</div>
                </div>
                <div class="card stat-card">
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Por Cobrar (Mes)</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--danger);">$${pendingTotal.toLocaleString()}</div>
                </div>
                <div class="card stat-card">
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Ventas del Mes ($)</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--primary);">$${monthTotal.toLocaleString()}</div>
                </div>
                <div class="card stat-card" id="year-stat-card" style="cursor: pointer; position: relative;">
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Total Ventas Año (${currentYear})</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--warning);">$${yearTotal.toLocaleString()}</div>
                    <div style="font-size: 0.7rem; color: var(--primary); margin-top: 0.5rem;">Ver detalle mensual →</div>
                </div>
            </div>
            
            <div class="card fade-in" style="margin-top: 4rem; padding: 2rem; text-align: center; border-style: dashed; border-color: var(--border);">
                <h2 style="color: var(--primary); margin-bottom: 1rem;">¡Bienvenido a MÄKA Baby CRM!</h2>
                <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto;">
                    Use el menú lateral para gestionar sus clientes, registrar nuevas ventas o administrar su equipo de trabajo.
                </p>
            </div>
        `;

        document.getElementById('year-stat-card').onclick = () => this.showYearlyDetail();
    },

    showYearlyDetail() {
        const sales = Store.state.sales || [];
        const currentYear = new Date().getFullYear();
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        const monthlySummary = Array.from({ length: 12 }, (_, i) => {
            const monthSales = sales.filter(s => {
                const date = new Date(s.date);
                return date.getMonth() === i && date.getFullYear() === currentYear;
            });
            const total = monthSales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
            return { month: monthNames[i], total, count: monthSales.length };
        });

        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="modal-content" style="width: 500px;">
                <h2 style="margin-bottom: 1.5rem; color: var(--primary);">Resumen Anual ${currentYear}</h2>
                <div class="table-container" style="max-height: 300px; overflow-y: scroll; display: block; border: 1px solid var(--border); border-radius: var(--radius);">
                    <table class="yearly-summary-table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th style="background: var(--bg-sidebar); padding: 10px; position: sticky; top: 0; z-index: 1;">Mes</th>
                                <th style="background: var(--bg-sidebar); padding: 10px; text-align: center; position: sticky; top: 0; z-index: 1;">Cant.</th>
                                <th style="background: var(--bg-sidebar); padding: 10px; text-align: right; position: sticky; top: 0; z-index: 1;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monthlySummary.map(m => `
                                <tr>
                                    <td data-label="Mes" class="cell-month" style="padding: 10px;">${m.month}</td>
                                    <td data-label="Cant." class="cell-count" style="padding: 10px; text-align: center;">${m.count}</td>
                                    <td data-label="Total" class="cell-total" style="padding: 10px; text-align: right; font-weight: 600;">$${m.total.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-primary" id="close-modal-summary">Cerrar</button>
                </div>
            </div>
        `;
        modalContainer.style.display = 'flex';
        document.getElementById('close-modal-summary').onclick = () => modalContainer.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
