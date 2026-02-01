import { db, auth } from './firebase-config.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const Store = {
    state: {
        clients: [],
        users: [], // We might use a dedicated 'users' collection for management
        currentUser: null,
        sales: [],
        currentRoute: window.location.hash || '#dashboard',
        loading: true
    },

    listeners: [],

    subscribe(callback) {
        this.listeners.push(callback);
    },

    notify() {
        this.listeners.forEach(callback => callback(this.state));
    },

    init() {
        // Listen for Auth changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.state.currentUser = {
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    role: 'Super Admin' // Default for now, should be fetched from a user doc
                };
                this.initDataListeners();
            } else {
                this.state.currentUser = null;
                this.state.clients = [];
                this.state.sales = [];
                this.notify();
            }
        });
    },

    initDataListeners() {
        // Listen for Clients
        onSnapshot(collection(db, "clients"), (snapshot) => {
            this.state.clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.state.loading = false;
            this.notify();
        });

        // Listen for Sales
        onSnapshot(collection(db, "sales"), (snapshot) => {
            this.state.sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.notify();
        });
    },

    // Client Methods
    async addClient(client) {
        await addDoc(collection(db, "clients"), client);
    },

    async updateClient(id, updatedClient) {
        const clientRef = doc(db, "clients", id);
        await updateDoc(clientRef, updatedClient);
    },

    async deleteClient(id) {
        await deleteDoc(doc(db, "clients", id));
    },

    // Auth Methods
    async login(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async logout() {
        await signOut(auth);
    },

    async updateCurrentUser(data) {
        const user = auth.currentUser;
        if (data.name) {
            await updateProfile(user, { displayName: data.name });
            this.state.currentUser.name = data.name;
        }
        if (data.password) {
            await updatePassword(user, data.password);
        }
        this.notify();
        return true;
    },

    setRoute(route) {
        this.state.currentRoute = route;
        this.notify();
    }
};

Store.init();
