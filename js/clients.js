import { Store } from './store.js';

export const ClientsModule = {
    render() {
        const clients = Store.state.clients;

        return `
            <div class="card fade-in">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.length > 0 ? clients.map(client => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 600;">${client.name}</div>
                                    </td>
                                    <td>${client.email}</td>
                                    <td>${client.phone}</td>
                                    <td>
                                        <span class="status-badge ${client.status === 'Activo' ? 'status-active' : 'status-inactive'}">
                                            ${client.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 10px;">
                                            <button class="btn-icon edit-client" data-id="${client.id}" title="Editar">✏️</button>
                                            <button class="btn-icon delete-client" data-id="${client.id}" title="Eliminar">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-muted);">No hay clientes registrados</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    init() {
        this.attachEventListeners();
    },

    attachEventListeners() {
        const contentArea = document.getElementById('content-area');

        contentArea.onclick = (e) => {
            const editBtn = e.target.closest('.edit-client');
            const deleteBtn = e.target.closest('.delete-client');

            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                this.showModal(id);
            }

            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
                    Store.deleteClient(id);
                }
            }
        };

        const addBtn = document.getElementById('add-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showModal();
        }
    },

    showModal(id = null) {
        const client = id ? Store.state.clients.find(c => c.id === id) : { name: '', email: '', phone: '', status: 'Activo' };
        const modalContainer = document.getElementById('modal-container');

        modalContainer.innerHTML = `
            <div class="modal-content">
                <h2 style="margin-bottom: 1.5rem;">${id ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <form id="client-form">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" class="form-control" name="name" value="${client.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" class="form-control" name="email" value="${client.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="text" class="form-control" name="phone" value="${client.phone}" required>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select class="form-control" name="status">
                            <option value="Activo" ${client.status === 'Activo' ? 'selected' : ''}>Activo</option>
                            <option value="Inactivo" ${client.status === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                        <button type="button" class="btn btn-ghost" id="close-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${id ? 'Guardar Cambios' : 'Crear Cliente'}</button>
                    </div>
                </form>
            </div>
        `;

        modalContainer.style.display = 'flex';

        document.getElementById('close-modal').onclick = () => {
            modalContainer.style.display = 'none';
        };

        document.getElementById('client-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const clientData = Object.fromEntries(formData.entries());

            if (id) {
                Store.updateClient(id, clientData);
            } else {
                Store.addClient(clientData);
            }
            modalContainer.style.display = 'none';
        };
    }
};
