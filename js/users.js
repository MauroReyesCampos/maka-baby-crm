import { Store } from './store.js';

export const UsersModule = {
    render() {
        const users = Store.state.users;
        const currentUser = Store.state.currentUser;

        return `
            <div class="card fade-in">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.length > 0 ? users.map(user => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 600;">${user.name}</div>
                                    </td>
                                    <td>${user.email}</td>
                                    <td>
                                        <span class="status-badge ${user.role === 'Super Admin' ? 'status-active' : 'status-inactive'}">
                                            ${user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 10px;">
                                            <button class="btn-icon edit-user" data-id="${user.id}" title="Editar">✏️</button>
                                            ${user.uid !== currentUser?.uid ? `<button class="btn-icon delete-user" data-id="${user.id}" title="Eliminar">🗑️</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center; padding: 3rem; color: var(--text-muted);">No hay usuarios registrados</td></tr>'}
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
            const editBtn = e.target.closest('.edit-user');
            const deleteBtn = e.target.closest('.delete-user');

            if (editBtn) {
                const id = editBtn.dataset.id;
                this.showModal(id);
            }

            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
                    Store.deleteUser(id);
                }
            }
        };

        const addBtn = document.getElementById('add-btn');
        if (addBtn) {
            // Need to ensure we only attach this once or handle cleanup, 
            // but for this simple app structure re-attaching on init is okay 
            // as long as we don't duplicate excessively. 
            // Ideally App.js manages the button visibility, but we handle the click here.
            addBtn.onclick = () => this.showModal();
        }
    },

    showModal(id = null) {
        const user = id ? Store.state.users.find(u => u.id === id) : { name: '', email: '', role: 'Vendedor' };
        const modalContainer = document.getElementById('modal-container');
        const isEdit = !!id;

        modalContainer.innerHTML = `
            <div class="modal-content">
                <h2 style="margin-bottom: 1.5rem;">${isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <form id="user-form">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" class="form-control" name="name" value="${user.name}" required>
                    </div>
                    ${!isEdit ? `
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" class="form-control" name="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" class="form-control" name="password" required minlength="6">
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <label>Rol</label>
                        <select class="form-control" name="role">
                            <option value="Vendedor" ${user.role === 'Vendedor' ? 'selected' : ''}>Vendedor</option>
                            <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                            <option value="Super Admin" ${user.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                        <button type="button" class="btn btn-ghost" id="close-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                    </div>
                </form>
            </div>
        `;

        modalContainer.style.display = 'flex';

        document.getElementById('close-modal').onclick = () => {
            modalContainer.style.display = 'none';
        };

        document.getElementById('user-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userData = Object.fromEntries(formData.entries());

            try {
                if (isEdit) {
                    await Store.updateUser(id, {
                        name: userData.name,
                        role: userData.role
                    });
                } else {
                    const result = await Store.registerUser(userData);
                    if (!result.success) {
                        alert('Error al crear usuario: ' + result.message);
                        return;
                    }
                }
                modalContainer.style.display = 'none';
            } catch (error) {
                console.error(error);
                alert('Ocurrió un error al guardar.');
            }
        };
    }
};
