import { db, auth } from './firebase-config.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
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
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                let role = 'Vendedor'; // Default role
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        role = userDoc.data().role;
                    }
                } catch (e) {
                    console.error("Error fetching user role:", e);
                }

                this.state.currentUser = {
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    role: role
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

        // Listen for Users
        onSnapshot(collection(db, "users"), (snapshot) => {
            this.state.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            date: new Date().toISOString(),
            paid: false,
            status: 'Pendiente'
        };
        await addDoc(collection(db, "sales"), newSale);
    },

    async updateSale(id, updatedData) {
        const saleRef = doc(db, "sales", id);
        await updateDoc(saleRef, updatedData);
    },

    async deleteSale(id) {
        try {
            await deleteDoc(doc(db, "sales", id));
            return { success: true };
        } catch (error) {
            console.error("Error deleting sale:", error);
            return { success: false, message: error.message };
        }
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

            await Promise.all([...clientDeletions, ...salesDeletions]);

            // Clear LocalStorage
            localStorage.clear();

            console.log('Toda la información ha sido eliminada.');
            return { success: true };
        } catch (error) {
            console.error("Error al borrar datos:", error);
            return { success: false, error: error.message };
        }
    },

    // User Management Methods (Firestore based)
    async registerUser(userData) {
        try {
            // Check if trying to create a Super Admin and if one already exists
            if (userData.role === 'Super Admin') {
                const q = query(collection(db, "users"), where("role", "==", "Super Admin"));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    return { success: false, message: 'Ya existe un Super Administrador. No se puede crear otro.' };
                }
            }

            // 1. Create the account in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const user = userCredential.user;

            // 2. Set the display name
            await updateProfile(user, { displayName: userData.name });

            // 3. Save additional info to Firestore 'users' collection
            // FIXED: Use setDoc with user.uid to ensure the ID matches what onAuthStateChanged uses
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: userData.name,
                email: userData.email,
                role: userData.role || 'Admin',
                createdAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error("Error en registro:", error);
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
