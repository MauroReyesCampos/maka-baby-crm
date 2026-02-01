export const Store = {
    state: {
        clients: JSON.parse(localStorage.getItem('spectral_clients')) || [
            { id: 1, name: 'Juan Pérez', email: 'juan@example.com', phone: '123-456-789', status: 'Activo' },
            { id: 2, name: 'María García', email: 'maria@example.com', phone: '987-654-321', status: 'Inactivo' }
        ],
        currentRoute: window.location.hash || '#dashboard'
    },

    listeners: [],

    subscribe(callback) {
        this.listeners.push(callback);
    },

    notify() {
        this.listeners.forEach(callback => callback(this.state));
    },

    setClients(clients) {
        this.state.clients = clients;
        localStorage.setItem('spectral_clients', JSON.stringify(clients));
        this.notify();
    },

    addClient(client) {
        const newClient = { ...client, id: Date.now() };
        this.setClients([...this.state.clients, newClient]);
    },

    updateClient(id, updatedClient) {
        const clients = this.state.clients.map(c => c.id === id ? { ...c, ...updatedClient } : c);
        this.setClients(clients);
    },

    deleteClient(id) {
        const clients = this.state.clients.filter(c => c.id !== id);
        this.setClients(clients);
    },

    setRoute(route) {
        this.state.currentRoute = route;
        this.notify();
    }
};
