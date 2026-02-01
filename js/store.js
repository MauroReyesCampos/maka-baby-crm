import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { db, auth, firebaseConfig } from './firebase-config.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    getDocs,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    getAuth
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
        // Listen for Users independently of auth (to detect "system fresh" state)
        onSnapshot(collection(db, "users"), (snapshot) => {
            this.state.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.state.loading = false;
            this.notify();
        }, (error) => {
            console.error("Error listening to users:", error);
            this.state.loading = false;
            this.notify();
        });

        // Listen for Auth changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.state.currentUser = {
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    role: 'Super Admin' // Default for now
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
        if (this.state.currentUser.role === 'Vendedor') throw new Error("Acceso denegado");
        await addDoc(collection(db, "clients"), client);
    },

    async updateClient(id, updatedClient) {
        if (this.state.currentUser.role === 'Vendedor') throw new Error("Acceso denegado");
        const clientRef = doc(db, "clients", id);
        await updateDoc(clientRef, updatedClient);
    },

    async deleteClient(id) {
        if (this.state.currentUser.role === 'Vendedor') throw new Error("Acceso denegado");
        await deleteDoc(doc(db, "clients", id));
    },

    // Sale Methods
    async addSale(saleData) {
        const year = new Date().getFullYear();
        // Generar SaleNumber secuencial (opcional: se puede hacer más robusto)
        const yearSales = this.state.sales.filter(s => s.saleNumber && s.saleNumber.startsWith(year.toString()));
        let nextNum = 1;
        if (yearSales.length > 0) {
            const lastNum = Math.max(...yearSales.map(s => {
                const parts = s.saleNumber.split('-');
                return parts.length > 1 ? parseInt(parts[1]) : 0;
            }));
            nextNum = lastNum + 1;
        }
        const saleNumber = `${year}-${nextNum.toString().padStart(3, '0')}`;

        const newSale = {
            ...saleData,
            saleNumber,
            date: new Date().toISOString()
        };
        await addDoc(collection(db, "sales"), newSale);
    },

    async updateSale(id, updatedData) {
        if (this.state.currentUser.role === 'Vendedor') throw new Error("Acceso denegado");
        const saleRef = doc(db, "sales", id);
        await updateDoc(saleRef, updatedData);
    },

    async deleteSale(id) {
        if (this.state.currentUser.role === 'Vendedor') throw new Error("Acceso denegado");
        await deleteDoc(doc(db, "sales", id));
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
    },

    async wipeAllData() {
        try {
            // Clear Clients
            const clientsSnapshot = await getDocs(collection(db, "clients"));
            const clientDeletions = clientsSnapshot.docs.map(d => deleteDoc(doc(db, "clients", d.id)));

            // Clear Sales
            const salesSnapshot = await getDocs(collection(db, "sales"));
            const salesDeletions = salesSnapshot.docs.map(d => deleteDoc(doc(db, "sales", d.id)));

            // Clear Users
            const usersSnapshot = await getDocs(collection(db, "users"));
            const userDeletions = usersSnapshot.docs.map(d => deleteDoc(doc(db, "users", d.id)));

            await Promise.all([...clientDeletions, ...salesDeletions, ...userDeletions]);

            // Clear Local and Session Storage
            localStorage.clear();
            sessionStorage.clear();

            console.log('Toda la información ha sido eliminada.');
            return { success: true };
        } catch (error) {
            console.error("Error al borrar datos:", error);
            return { success: false, error: error.message };
        }
    },

    // User Management Methods (Firestore based)
    async registerUser(userData) {
        let secondaryApp = null;
        try {
            // Direct Firestore check to bypass state sync delays
            const usersRef = collection(db, "users");
            const q = query(usersRef, limit(1));
            const snapshot = await getDocs(q);
            const hasUsers = !snapshot.empty;

            const currentUser = this.state.currentUser;

            // Bloquear registro público si ya existe al menos un usuario
            if (hasUsers && !currentUser) {
                throw new Error("El sistema ya ha sido inicializado. Inicie sesión para añadir usuarios.");
            }

            let targetAuth = auth;

            // Si hay un admin logueado, usar una App secundaria para no desloguearlo
            if (currentUser) {
                const secondaryAppName = `secondaryApp_${Date.now()}`;
                secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
                targetAuth = getAuth(secondaryApp);
            }

            // 1. Create the account in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(targetAuth, userData.email, userData.password);
            const user = userCredential.user;

            // 2. Set the display name
            await updateProfile(user, { displayName: userData.name });

            // 3. Save additional info to Firestore 'users' collection (using main db)
            await addDoc(collection(db, "users"), {
                uid: user.uid,
                name: userData.name,
                email: userData.email,
                role: userData.role || 'Admin',
                createdAt: new Date().toISOString()
            });

            // Cleanup secondary app if used
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }

            return { success: true };
        } catch (error) {
            console.error("Error en registro:", error);
            if (secondaryApp) {
                await deleteApp(secondaryApp).catch(console.error);
            }
            return { success: false, message: error.message };
        }
    },

    async updateUser(id, updatedData) {
        const userRef = doc(db, "users", id);
        await updateDoc(userRef, updatedData);
    },

    async deleteUser(id) {
        await deleteDoc(doc(db, "users", id));
    }
};

Store.init();
