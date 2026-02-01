import { Store } from './store.js';
import { ClientsModule } from './clients.js';

const App = {
    init() {
        this.contentArea = document.getElementById('content-area');
        this.pageTitle = document.getElementById('page-title');
        this.addBtn = document.getElementById('add-btn');
        this.navItems = document.querySelectorAll('.nav-item');

        window.onhashchange = () => this.handleRoute();
        Store.subscribe(() => this.render());

        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash || '#dashboard';
        Store.setRoute(hash);
        this.render();
    },

    render() {
        const hash = Store.state.currentRoute;

        // Update active nav item
        this.navItems.forEach(item => {
            if (item.getAttribute('href') === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Toggle Actions
        this.addBtn.style.display = hash === '#clients' ? 'flex' : 'none';

        // Render Page
        switch (hash) {
            case '#clients':
                this.pageTitle.innerText = 'Gestión de Clientes';
                this.contentArea.innerHTML = ClientsModule.render();
                ClientsModule.init();
                break;
            case '#settings':
                this.pageTitle.innerText = 'Configuración';
                this.contentArea.innerHTML = '<div class="card">Próximamente: Configuración del Sistema</div>';
                break;
            default:
                this.pageTitle.innerText = 'Dashboard';
                this.contentArea.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
                        <div class="card">
                            <h3 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Total Clientes</h3>
                            <div style="font-size: 2.5rem; font-weight: 700;">${Store.state.clients.length}</div>
                        </div>
                        <div class="card">
                            <h3 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Ventas (Mes)</h3>
                            <div style="font-size: 2.5rem; font-weight: 700;">$12.5k</div>
                        </div>
                        <div class="card">
                            <h3 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Nuevos Prospectos</h3>
                            <div style="font-size: 2.5rem; font-weight: 700;">24</div>
                        </div>
                    </div>
                `;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
