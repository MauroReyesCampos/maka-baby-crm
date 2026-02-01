import { Store } from './store.js';

export const ClientsModule = {
    render() {
        const clients = Store.state.clients;
        const canEditOrDelete = Store.state.currentUser && Store.state.currentUser.role !== 'Vendedor';

        return `
            <div class="card fade-in">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre/Razon Social</th>
                                <th>Dirección</th>
                                <th>Complemento</th>
                                <th>Telefono</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.length > 0 ? clients.map(client => `
                                <tr>
                                    <td data-label="Nombre"><div style="font-weight: 600;">${client.name}</div></td>
                                    <td data-label="Dirección">${client.address || ''}</td>
                                    <td data-label="Complemento">${client.complement || ''}</td>
                                    <td data-label="Teléfono">${client.phone}</td>
                                    <td data-label="Acciones">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                            ${canEditOrDelete ? `
                                                <button class="btn-icon edit-client" data-id="${client.id}" title="Editar">✏️</button>
                                                <button class="btn-icon delete-client" data-id="${client.id}" title="Eliminar">🗑️</button>
                                            ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Solo lectura</span>'}
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
        const addBtn = document.getElementById('add-btn');
        if (addBtn) {
            addBtn.onclick = () => {
                if (Store.state.currentUser && Store.state.currentUser.role === 'Vendedor') {
                    alert('No tienes permisos para añadir clientes.');
                    return;
                }
                this.showModal();
            };
        }
    },

    attachEventListeners() {
        const contentArea = document.getElementById('content-area');

        contentArea.onclick = (e) => {
            const editBtn = e.target.closest('.edit-client');
            const deleteBtn = e.target.closest('.delete-client');

            if (editBtn) {
                const id = (editBtn.dataset.id); // Keeping string id
                this.showModal(id);
            }

            if (deleteBtn) {
                const id = (deleteBtn.dataset.id);
                this.deleteClient(id);
            }
        };
    },

    async deleteClient(id) {
        if (Store.state.currentUser && Store.state.currentUser.role === 'Vendedor') {
            alert('No tienes permisos para eliminar clientes.');
            return;
        }
        if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            await Store.deleteClient(id);
        }
    },

    showModal(id = null) {
        if (Store.state.currentUser && Store.state.currentUser.role === 'Vendedor') {
            alert('No tienes permisos para editar clientes.');
            return;
        }

        const client = id ? Store.state.clients.find(c => c.id === id) : {
            name: '', nit: '', phone: '', address: '', complement: '', neighborhood: '', city: '', state: ''
        };
        const modalContainer = document.getElementById('modal-container');

        modalContainer.innerHTML = `
            <div class="modal-content" style="width: 600px; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 1.5rem; color: var(--primary);">${id ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <form id="client-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Nombre/Razon Social</label>
                            <input type="text" class="form-control" name="name" value="${client.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Cedula/NIT</label>
                            <input type="text" class="form-control" name="nit" id="nit-input" value="${client.nit}" placeholder="Ej: 900.123.456" required>
                        </div>
                        <div class="form-group">
                            <label>Telefono</label>
                            <input type="text" class="form-control" name="phone" id="phone-input" value="${client.phone}" placeholder="Ej: (310) 1234567" required>
                        </div>
                        <div class="form-group">
                            <label>Dirección</label>
                            <input type="text" class="form-control" name="address" value="${client.address}" required>
                        </div>
                        <div class="form-group">
                            <label>Complemento</label>
                            <input type="text" class="form-control" name="complement" value="${client.complement || ''}">
                        </div>
                        <div class="form-group">
                            <label>Barrio</label>
                            <input type="text" class="form-control" name="neighborhood" value="${client.neighborhood}" required>
                        </div>
                        <div class="form-group">
                            <label>Ciudad</label>
                            <input type="text" class="form-control" name="city" value="${client.city}" required>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Departamento</label>
                            <input type="text" class="form-control" name="state" value="${client.state}" required>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; position: sticky; bottom: 0; background: white; padding-top: 1rem;">
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

        const nitInput = document.getElementById('nit-input');
        const phoneInput = document.getElementById('phone-input');

        nitInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value) {
                value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }
            e.target.value = value;
        });

        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = `(${value}`;
                } else if (value.length <= 10) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 10)}`;
                }
            }
            e.target.value = value;
        });

        document.getElementById('client-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const clientData = Object.fromEntries(formData.entries());

            if (id) {
                await Store.updateClient(id, clientData);
            } else {
                await Store.addClient(clientData);
            }
            modalContainer.style.display = 'none';
        };
    }
};
