import { Store } from './store.js';

export const SalesModule = {
    render() {
        const sales = Store.state.sales || [];
        const clients = Store.state.clients || [];
        const currentUser = Store.state.currentUser;
        const canEditOrDelete = currentUser && currentUser.role !== 'Vendedor';

        // Render structure first, then initialize table body
        return `
            <div class="card fade-in">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>No. Venta</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Estado</th>
                                <th>Total Venta</th>
                                <th style="text-align: right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="sales-table-body">
                            ${sales.length > 0 ? sales.sort((a, b) => new Date(b.date) - new Date(a.date)).map(sale => {
            const client = clients.find(c => c.id === (sale.clientId)); // Assuming IDs are strings in Firestore, but index.html used Number conversion. Let's stick to string if Firestore IDs are strings, but index.html used Number(). This suggests local IDs were used or legacy?
            // Firestore IDs are strings. But if clientId refers to a custom ID field... Store.js uses doc.id which is string.
            // However, store.js addDoc uses auto-ID. 
            // Wait, in index.html line 1054: clients.find(c => c.id === Number(sale.clientId));
            // This suggests IDs are numbers? But Firestore IDs are strings "7a8s...". 
            // If they used addDoc, it's string.
            // If they used custom ID... 
            // In Store.js: this.state.clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // So id is string.
            // Why did index.html use Number()? Maybe manual ID generation was used previously?
            // Or maybe I should just use loose equality == or string comparison.
            // Let's use string comparison and remove Number().
            const clientName = client ? client.name : (clients.find(c => c.id == sale.clientId)?.name || 'Desconocido');

            return `
                                    <tr>
                                        <td data-label="No. Venta">
                                            <span class="status-badge" style="background: var(--bg-sidebar); border: 1px solid var(--border); color: var(--text-main);">
                                                ${sale.saleNumber}
                                            </span>
                                        </td>
                                        <td data-label="Fecha">${new Date(sale.date).toLocaleDateString()}</td>
                                        <td data-label="Cliente" style="font-weight: 600;">${clientName}</td>
                                        <td data-label="Estado">
                                            <span class="status-badge ${sale.paid ? 'status-active' : 'status-inactive'}">
                                                ${sale.paid ? 'Pagada' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td data-label="Total Venta" style="font-weight: 700; color: var(--primary);">$${sale.grandTotal ? sale.grandTotal.toLocaleString() : '0'}</td>
                                        <td data-label="Acciones">
                                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                                <button class="btn-icon print-invoice" data-id="${sale.id}" title="Imprimir">🖨️</button>
                                                <button class="btn-icon print-label" data-id="${sale.id}" title="Etiqueta">📦</button>
                                                <button class="btn-icon toggle-payment" data-id="${sale.id}" title="${sale.paid ? 'Marcar como Pendiente' : 'Marcar como Pagada'}">
                                                    ${sale.paid ? '✅' : '💰'}
                                                </button>
                                                ${canEditOrDelete ? `
                                                    <button class="btn-icon edit-sale" data-id="${sale.id}" title="Editar">✏️</button>
                                                    <button class="btn-icon delete-sale" data-id="${sale.id}" title="Eliminar">🗑️</button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
        }).join('') : '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No hay ventas.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    init() {
        this.attachEventListeners();
        const addBtn = document.getElementById('add-btn');
        if (addBtn) addBtn.onclick = () => this.showModal();
    },

    attachEventListeners() {
        const tableBody = document.getElementById('sales-table-body');
        if (tableBody) {
            tableBody.onclick = (e) => {
                const printInvoiceBtn = e.target.closest('.print-invoice');
                const printLabelBtn = e.target.closest('.print-label');
                const togglePaymentBtn = e.target.closest('.toggle-payment');
                const editBtn = e.target.closest('.edit-sale');
                const deleteBtn = e.target.closest('.delete-sale');

                if (printInvoiceBtn) this.printInvoice(printInvoiceBtn.dataset.id);
                if (printLabelBtn) this.printShippingLabel(printLabelBtn.dataset.id);
                if (togglePaymentBtn) this.togglePaymentStatus(togglePaymentBtn.dataset.id);
                if (editBtn) this.showModal(editBtn.dataset.id);
                if (deleteBtn) this.deleteSale(deleteBtn.dataset.id);
            }
        }
    },

    showModal(id = null) {
        if (id && Store.state.currentUser.role === 'Vendedor') {
            alert('No tienes permisos para editar ventas.');
            return;
        }
        const sale = id ? Store.state.sales.find(s => s.id === id) : null;
        const clients = Store.state.clients;
        const modalContainer = document.getElementById('modal-container');

        modalContainer.innerHTML = `
            <div class="modal-content" style="width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 1.5rem; color: var(--primary);">${id ? 'Editar Venta ' + sale.saleNumber : 'Nueva Venta'}</h2>
                <form id="sales-form">
                    <div class="form-group">
                        <label>Seleccionar Cliente</label>
                        <select class="form-control" name="clientId" required>
                            <option value="">Seleccione un cliente...</option>
                            ${clients.map(c => `<option value="${c.id}" ${sale && sale.clientId == c.id ? 'selected' : ''}>${c.name} (${c.nit || 'N/A'})</option>`).join('')}
                        </select>
                    </div>

                    <div style="margin-top: 2rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 1rem;">Detalle de Productos</h3>
                        <div id="items-container"></div>
                        <button type="button" class="btn btn-ghost" id="add-item-row" style="margin-top: 1rem;">+ Añadir Producto</button>
                    </div>

                    <div style="margin-top: 2rem; border-top: 2px solid var(--border); padding-top: 1.5rem; text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: 700;">Total Venta: <span id="grand-total" style="color: var(--primary);">$${sale ? (sale.grandTotal || 0).toLocaleString() : '0'}</span></div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                        <button type="button" class="btn btn-ghost" id="close-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${id ? 'Guardar Cambios' : 'Registrar Venta'}</button>
                    </div>
                </form>
            </div>
        `;
        modalContainer.style.display = 'flex';

        const itemsContainer = document.getElementById('items-container');
        const addRow = (itemData = null) => {
            const row = document.createElement('div');
            row.className = 'sale-item-row fade-in';
            row.style = 'display: grid; grid-template-columns: 2.5fr 100px 150px 150px auto; gap: 1rem; margin-bottom: 1.5rem; align-items: end; border-bottom: 1px solid var(--border); padding-bottom: 1rem;';
            row.innerHTML = `
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Descripción</label>
                    <input type="text" class="form-control" name="desc" value="${itemData ? itemData.description : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Cant.</label>
                    <input type="number" class="form-control qty-input" name="qty" min="1" value="${itemData ? itemData.quantity : '1'}" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Precio Unit.</label>
                    <input type="text" class="form-control price-input" name="price" value="${itemData ? itemData.unitPrice.toLocaleString() : '0'}" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Total</label>
                    <div class="form-control line-total" style="background: var(--bg-sidebar); border: none; font-weight: 600;">$${itemData ? itemData.total.toLocaleString() : '0'}</div>
                </div>
                <button type="button" class="btn-icon remove-row" style="color: var(--danger);">🗑️</button>
            `;
            itemsContainer.appendChild(row);
            this.bindRowEvents(row);
        };

        if (sale && sale.items) {
            sale.items.forEach(item => addRow(item));
        } else {
            addRow();
        }

        document.getElementById('add-item-row').onclick = () => addRow();
        document.getElementById('close-modal').onclick = () => modalContainer.style.display = 'none';

        document.getElementById('sales-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const clientId = formData.get('clientId');
            const rows = itemsContainer.querySelectorAll('.sale-item-row');
            const items = Array.from(rows).map(row => {
                const qty = Number(row.querySelector('[name="qty"]').value);
                const price = Number(row.querySelector('[name="price"]').value.replace(/\D/g, ''));
                return {
                    description: row.querySelector('[name="desc"]').value,
                    quantity: qty,
                    unitPrice: price,
                    total: qty * price
                };
            });
            const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

            if (id) await Store.updateSale(id, { clientId, items, grandTotal });
            else await Store.addSale({ clientId, items, grandTotal });
            modalContainer.style.display = 'none';
        };
    },

    async deleteSale(id) {
        if (Store.state.currentUser.role === 'Vendedor') {
            alert('No tienes permisos.');
            return;
        }
        if (confirm('¿Eliminar esta venta?')) {
            const result = await Store.deleteSale(id);
            if (!result.success) {
                alert('No se pudo eliminar la venta: ' + result.message);
            }
        }
    },

    async togglePaymentStatus(id) {
        if (Store.state.currentUser.role === 'Vendedor') {
            alert('No tienes permisos para cambiar el estado de pago.');
            return;
        }
        const sale = Store.state.sales.find(s => s.id === id);
        if (!sale) return;

        const newStatus = !sale.paid;
        await Store.updateSale(id, {
            paid: newStatus,
            status: newStatus ? 'Pagada' : 'Pendiente'
        });
    },

    bindRowEvents(row) {
        const qtyInput = row.querySelector('.qty-input');
        const priceInput = row.querySelector('.price-input');
        const lineTotal = row.querySelector('.line-total');
        const removeBtn = row.querySelector('.remove-row');

        priceInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value) value = Number(value).toLocaleString();
            e.target.value = value;
            this.updateRowTotal(qtyInput, priceInput, lineTotal);
        });

        const updateHandler = () => this.updateRowTotal(qtyInput, priceInput, lineTotal);

        qtyInput.oninput = updateHandler;
        priceInput.oninput = updateHandler; // In case input event is fired differently
        removeBtn.onclick = () => {
            row.remove();
            this.updateGrandTotal();
        };
        // Initial calc
        this.updateRowTotal(qtyInput, priceInput, lineTotal);
    },

    updateRowTotal(qtyInput, priceInput, lineTotal) {
        const qty = Number(qtyInput.value) || 0;
        const price = Number(priceInput.value.replace(/\D/g, '')) || 0;
        const total = qty * price;
        lineTotal.innerText = `$${total.toLocaleString()}`;
        this.updateGrandTotal();
    },

    printInvoice(id) {
        const sale = Store.state.sales.find(s => s.id === id);
        const client = Store.state.clients.find(c => c.id === sale.clientId) || { name: 'Desconocido', nit: '', phone: '', address: '', city: '' };
        const printArea = document.getElementById('invoice-print-area');

        printArea.innerHTML = `
            <div style="padding: 2.5cm; font-family: 'Outfit', sans-serif; color: #333; width: 21cm; min-height: 27cm; margin: 0 auto; background: white; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <img src="logo.png" style="width: 4cm; height: auto;">
                    <div style="border: 1px solid #000; padding: 0.5rem 1rem; text-align: center;">
                        <div style="font-size: 0.8rem;">FACTURA DE VENTA</div>
                        <div style="font-size: 1.2rem; font-weight: 700;">N° ${sale.saleNumber}</div>
                    </div>
                </div>
                <div style="border-bottom: 2px solid #000; padding: 1rem 0; margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div><strong>CLIENTE:</strong> ${client.name}</div>
                        <div style="text-align: right;"><strong>FECHA:</strong> ${new Date(sale.date).toLocaleDateString()}</div>
                        <div><strong>NIT/CC:</strong> ${client.nit || ''}</div>
                        <div style="text-align: right;"><strong>TEL:</strong> ${client.phone || ''}</div>
                        <div><strong>DIR:</strong> ${client.address || ''} ${client.complement || ''}</div>
                        <div style="text-align: right;"><strong>BARRIO:</strong> ${client.neighborhood || ''}</div>
                        <div><strong>CIUDAD:</strong> ${client.city || ''}</div>
                        <div style="text-align: right;"><strong>DEPTO:</strong> ${client.state || ''}</div>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid #000;">
                            <th style="padding: 0.5rem; text-align: left;">DESCRIPCIÓN</th>
                            <th style="padding: 0.5rem; text-align: center;">CANT</th>
                            <th style="padding: 0.5rem; text-align: right;">VALOR UNIT</th>
                            <th style="padding: 0.5rem; text-align: right;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map(item => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 0.5rem;">${item.description}</td>
                                <td style="padding: 0.5rem; text-align: center;">${item.quantity}</td>
                                <td style="padding: 0.5rem; text-align: right;">$${item.unitPrice.toLocaleString()}</td>
                                <td style="padding: 0.5rem; text-align: right;">$${item.total.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="display: flex; justify-content: flex-end;">
                    <div style="width: 6cm; border-top: 2px solid #000; padding-top: 0.5rem; display: flex; justify-content: space-between;">
                        <strong>TOTAL:</strong>
                        <strong>$${(sale.grandTotal || 0).toLocaleString()}</strong>
                    </div>
                </div>
            </div>
        `;
        setTimeout(() => window.print(), 250);
    },

    printShippingLabel(id) {
        const sale = Store.state.sales.find(s => s.id === id);
        const client = Store.state.clients.find(c => c.id === sale.clientId) || { name: 'Desconocido' };
        const printArea = document.getElementById('invoice-print-area');

        printArea.innerHTML = `
            <div style="width: 21.59cm; height: 13.97cm; position: relative; background: white; padding: 0.5cm; box-sizing: border-box; margin: 0 auto;">
                <div style="width: 100%; height: 100%; border: 4px solid #000; border-radius: 40px; padding: 40px; position: relative; box-sizing: border-box;">
                    <div style="position: absolute; top: 40px; left: 60px; font-size: 1.1rem; line-height: 1.3;">
                        <strong>Milena Raynaud Prado</strong><br>
                        Carrera 65 #169A-50 casa 44<br>
                        Conjunto Jardines del Cabo<br>
                        Bogotá D.C.<br>
                        3177875935
                    </div>
                    <img src="logo.png" style="position: absolute; top: 15px; right: 60px; width: 140px;">
                    <div style="position: absolute; top: 175px; left: 40px; right: 40px; border-top: 3px solid #000;"></div>
                    <div style="position: absolute; top: 205px; left: 40px; right: 40px; text-align: center;">
                        <div style="font-size: 2.6rem; font-weight: 700;">${client.name}</div>
                        <div style="font-size: 1.7rem;">${client.address || ''}</div>
                        ${client.complement ? `<div style="font-size: 1.5rem;">${client.complement}</div>` : ''}
                        ${client.neighborhood ? `<div style="font-size: 1.5rem;">${client.neighborhood}</div>` : ''}
                        <div style="font-size: 1.5rem;">${client.city || ''} - ${client.state || ''}</div>
                        <div style="font-size: 1.8rem; font-weight: 600; margin-top: 20px;">${client.phone || ''}</div>
                    </div>
                </div>
            </div>
        `;
        setTimeout(() => window.print(), 250);
    },

    updateGrandTotal() {
        const totals = Array.from(document.querySelectorAll('.line-total'))
            .map(el => Number(el.innerText.replace(/\D/g, '')));
        const grand = totals.reduce((sum, val) => sum + val, 0);
        const grandEl = document.getElementById('grand-total');
        if (grandEl) grandEl.innerText = `$${grand.toLocaleString()}`;
    }
};
