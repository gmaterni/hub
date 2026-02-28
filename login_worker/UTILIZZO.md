# 🔌 Guida all'Utilizzo - Integrazione in App Esistenti

Questa guida mostra come integrare il sistema di autenticazione Cloudflare Worker nelle tue applicazioni web esistenti.

---

## 📖 Indice

1. [Integrazione Rapida](#integrazione-rapida)
2. [Integrazione in Sito Statico](#integrazione-in-sito-statico)
3. [Integrazione in React](#integrazione-in-react)
4. [Integrazione in Vue](#integrazione-in-vue)
5. [Integrazione in Applicazione Multi-Dominio](#integrazione-in-applicazione-multi-dominio)
6. [API Reference](#api-reference)
7. [Best Practices di Sicurezza](#best-practices-di-sicurezza)

---

## 🚀 Integrazione Rapida

### Passo 1: Configura l'URL del Worker

In tutte le pagine che usano l'autenticazione, imposta l'URL del tuo worker:

```javascript
const WORKER_URL = 'https://login-service.tuo-subdomain.workers.dev';
```

### Passo 2: Aggiungi il Bottone di Login

Nel tuo HTML, aggiungi un bottone che apre il popup:

```html
<button onclick="openLoginPopup()">Accedi</button>
```

### Passo 3: Aggiungi lo Script di Autenticazione

```html
<script>
    const WORKER_URL = 'https://login-service.tuo-subdomain.workers.dev';

    function openLoginPopup() {
        const w = 450, h = 550;
        const left = (window.innerWidth / 2) - (w / 2);
        const top = (window.innerHeight / 2) - (h / 2);

        const authWindow = window.open(
            WORKER_URL + '/login',
            'CloudflareAuth',
            `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
        );

        const messageHandler = (event) => {
            if (event.data && event.data.type === 'AUTH_SUCCESS') {
                localStorage.setItem('user_web_id', event.data.user_web_id);
                localStorage.setItem('auth_token', event.data.token);
                window.removeEventListener('message', messageHandler);
                if (authWindow && !authWindow.closed) authWindow.close();
                window.location.reload();
            }
        };

        window.addEventListener('message', messageHandler);
    }

    function isLoggedIn() {
        return !!localStorage.getItem('user_web_id');
    }

    function getCurrentUser() {
        return localStorage.getItem('user_web_id');
    }

    function logout() {
        localStorage.removeItem('user_web_id');
        localStorage.removeItem('auth_token');
        window.location.reload();
    }
</script>
```

### Passo 4: Proteggi le Pagine Riservate

Nelle pagine che richiedono autenticazione, aggiungi all'inizio:

```html
<script>
    if (!localStorage.getItem('user_web_id')) {
        window.location.replace('/login.html');
    }
</script>
```

---

## 🌐 Integrazione in Sito Statico

### Struttura Consigliata

```
tuosito/
├── index.html          (pagina pubblica)
├── login.html          (pagina di login)
├── dashboard.html      (pagina protetta)
└── js/
    └── auth.js         (codice di autenticazione)
```

### login.html

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <style>
        body {
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .card {
            background: #1a1a1a;
            padding: 40px;
            border-radius: 8px;
            border: 1px solid #2a2a2a;
            text-align: center;
        }
        button {
            background: #4a9eff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #357abd; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Benvenuto</h2>
        <p>Accedi per continuare</p>
        <button onclick="openLoginPopup()">Accedi con Email</button>
    </div>

    <script src="js/auth.js"></script>
    <script>
        // Se già loggato, reindirizza
        if (isLoggedIn()) {
            window.location.replace('dashboard.html');
        }
    </script>
</body>
</html>
```

### dashboard.html (Pagina Protetta)

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Dashboard</title>
    <script>
        if (!localStorage.getItem('user_web_id')) {
            window.location.replace('login.html');
        }
    </script>
</head>
<body>
    <h1>Area Riservata</h1>
    <p>Loggato come: <strong id="userEmail"></strong></p>
    <button onclick="logout()">Logout</button>

    <script src="js/auth.js"></script>
    <script>
        document.getElementById('userEmail').innerText = getCurrentUser();
    </script>
</body>
</html>
```

---

## ⚛️ Integrazione in React

### Crea il Contesto di Autenticazione

```jsx
// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const WORKER_URL = 'https://login-service.tuo-subdomain.workers.dev';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_web_id');
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = () => {
        return new Promise((resolve, reject) => {
            const w = 450, h = 550;
            const left = (window.innerWidth / 2) - (w / 2);
            const top = (window.innerHeight / 2) - (h / 2);

            const authWindow = window.open(
                WORKER_URL + '/login',
                'CloudflareAuth',
                `width=${w},height=${h},top=${top},left=${left}`
            );

            const messageHandler = (event) => {
                if (event.data && event.data.type === 'AUTH_SUCCESS') {
                    localStorage.setItem('user_web_id', event.data.user_web_id);
                    localStorage.setItem('auth_token', event.data.token);
                    setUser(event.data.user_web_id);
                    window.removeEventListener('message', messageHandler);
                    if (authWindow && !authWindow.closed) authWindow.close();
                    resolve(event.data.user_web_id);
                }
            };

            window.addEventListener('message', messageHandler);

            const checkClosed = setInterval(() => {
                if (authWindow && authWindow.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    reject(new Error('Popup chiuso'));
                }
            }, 500);
        });
    };

    const logout = () => {
        localStorage.removeItem('user_web_id');
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve essere usato dentro AuthProvider');
    }
    return context;
}
```

### Usa il Contesto nell'App

```jsx
// src/App.js
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
    const { user, isAuthenticated, login, logout, loading } = useAuth();

    if (loading) return <div>Caricamento...</div>;

    return (
        <div>
            {isAuthenticated ? (
                <div>
                    <h1>Benvenuto, {user}!</h1>
                    <button onClick={logout}>Logout</button>
                </div>
            ) : (
                <div>
                    <h1>Devi accedere</h1>
                    <button onClick={login}>Accedi</button>
                </div>
            )}
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
```

### Proteggi le Route

```jsx
// src/components/PrivateRoute.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div>Caricamento...</div>;
    
    return isAuthenticated ? children : <Navigate to="/login" />;
}
```

```jsx
// src/App.js (con React Router)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function Dashboard() {
    return <h1>Dashboard Riservata</h1>;
}

function Home() {
    const { login } = useAuth();
    return (
        <div>
            <h1>Home</h1>
            <button onClick={login}>Accedi</button>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
```

---

## 🟢 Integrazione in Vue

### Crea il Plugin di Autenticazione

```javascript
// src/plugins/auth.js
import { reactive } from 'vue';

const WORKER_URL = 'https://login-service.tuo-subdomain.workers.dev';

export const auth = reactive({
    user: localStorage.getItem('user_web_id') || null,
    
    get isAuthenticated() {
        return !!this.user;
    },
    
    login() {
        return new Promise((resolve, reject) => {
            const w = 450, h = 550;
            const left = (window.innerWidth / 2) - (w / 2);
            const top = (window.innerHeight / 2) - (h / 2);

            const authWindow = window.open(
                WORKER_URL + '/login',
                'CloudflareAuth',
                `width=${w},height=${h},top=${top},left=${left}`
            );

            const messageHandler = (event) => {
                if (event.data && event.data.type === 'AUTH_SUCCESS') {
                    localStorage.setItem('user_web_id', event.data.user_web_id);
                    localStorage.setItem('auth_token', event.data.token);
                    this.user = event.data.user_web_id;
                    window.removeEventListener('message', messageHandler);
                    if (authWindow && !authWindow.closed) authWindow.close();
                    resolve(event.data.user_web_id);
                }
            };

            window.addEventListener('message', messageHandler);
        });
    },
    
    logout() {
        localStorage.removeItem('user_web_id');
        localStorage.removeItem('auth_token');
        this.user = null;
    }
});
```

### Registra il Plugin

```javascript
// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import { auth } from './plugins/auth';

const app = createApp(App);
app.config.globalProperties.$auth = auth;
app.mount('#app');
```

### Usa nei Componenti

```vue
<!-- src/components/LoginButton.vue -->
<template>
    <div>
        <button v-if="!$auth.isAuthenticated" @click="handleLogin">
            Accedi
        </button>
        <div v-else>
            <p>Loggato come: {{ $auth.user }}</p>
            <button @click="$auth.logout()">Logout</button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginButton',
    methods: {
        async handleLogin() {
            try {
                await this.$auth.login();
                this.$router.push('/dashboard');
            } catch (error) {
                console.error('Login fallito:', error);
            }
        }
    }
};
</script>
```

### Guardia per Route Protette

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../plugins/auth';

const routes = [
    { path: '/', component: () => import('../views/Home.vue') },
    { 
        path: '/dashboard', 
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        next('/login');
    } else {
        next();
    }
});

export default router;
```

---

## 🌍 Integrazione in Applicazione Multi-Dominio

### Scenario

Hai più siti (sito-a.com, sito-b.com, sito-c.com) che devono condividere l'autenticazione.

### Configurazione

Tutti i siti puntano allo stesso worker:

```javascript
// Configurazione comune in tutti i siti
const WORKER_URL = 'https://login-service.tuo-subdomain.workers.dev';
```

### Considerazioni

1. **localStorage è per-domain**: Ogni dominio ha il proprio localStorage
2. **Sessioni indipendenti**: L'utente deve fare login separatamente su ogni dominio
3. **Log centralizzati**: Tutti gli accessi sono tracciati nel worker

### Opzione: Single Sign-On (SSO)

Per condividere la sessione tra domini, usa un sottodominio comune:

```
auth.tuosito.com → Worker
site1.tuosito.com → Sito 1
site2.tuosito.com → Sito 2
```

Essendo tutti sottodomini dello stesso dominio principale, possono condividere cookie e localStorage.

---

## 📡 API Reference

### Endpoint del Worker

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/login` | Pagina di login |
| `GET` | `/index.html` | Dashboard |
| `POST` | `/api/auth` | Autenticazione |
| `GET` | `/api/logs` | Recupera log accessi |
| `GET` | `/logout` | Logout |

### POST /api/auth

**Request:**
```json
{
    "action": "login" | "signup",
    "email": "user@example.com",
    "password": "password123"
}
```

**Response (Successo):**
```json
{
    "success": true,
    "email": "user@example.com",
    "token": "eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDg3MTIwMDB9"
}
```

**Response (Errore):**
```json
{
    "error": "Credenziali non valide"
}
```

### GET /api/logs

**Response:**
```json
{
    "logs": [
        {
            "email": "user@example.com",
            "action": "login",
            "timestamp": "2024-02-24T10:30:00.000Z",
            "ip": "123.45.67.89",
            "country": "IT",
            "userAgent": "Mozilla/5.0..."
        }
    ]
}
```

---

## 🔒 Best Practices di Sicurezza

### 1. Verifica l'Origin nei Messaggi

```javascript
const allowedOrigin = 'https://login-service.tuo-subdomain.workers.dev';

window.addEventListener('message', (event) => {
    if (event.origin !== allowedOrigin) return;
    if (event.data && event.data.type === 'AUTH_SUCCESS') {
        // Procedi...
    }
});
```

### 2. Usa HTTPS in Produzione

Assicurati che tutti i domini usino HTTPS per prevenire attacchi man-in-the-middle.

### 3. Non Esporre il Token

Il token è salvato in localStorage. Per maggiore sicurezza:

```javascript
// Opzione: usa sessionStorage invece di localStorage
sessionStorage.setItem('auth_token', token);
// Il token viene eliminato quando si chiude il browser
```

### 4. Implementa Timeout di Sessione

```javascript
const SESSION_TIMEOUT = 3600000; // 1 ora

function checkSessionTimeout() {
    const lastActivity = localStorage.getItem('lastActivity');
    const now = Date.now();
    
    if (lastActivity && (now - parseInt(lastActivity)) > SESSION_TIMEOUT) {
        logout();
        alert('Sessione scaduta');
    }
    
    localStorage.setItem('lastActivity', now.toString());
}

// Aggiorna ad ogni interazione
document.addEventListener('click', checkSessionTimeout);
document.addEventListener('keypress', checkSessionTimeout);
```

### 5. Proteggi le API Backend

Se hai un backend, verifica il token prima di servire dati sensibili:

```javascript
// Nel frontend
async function fetchProtectedData() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/protected', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}
```

```javascript
// Nel backend (esempio Node.js)
function verifyToken(token) {
    try {
        const decoded = JSON.parse(atob(token));
        return decoded.email;
    } catch (e) {
        return null;
    }
}

app.get('/api/protected', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const email = verifyToken(token);
    
    if (!email) {
        return res.status(401).json({ error: 'Non autorizzato' });
    }
    
    // Procedi con la richiesta
});
```

---

## 🧪 Debug e Troubleshooting

### Il popup non si apre

- Controlla i blocker popup del browser
- Verifica che `window.open` non sia bloccato

### Il login non reindirizza

- Apri la console del browser per errori
- Verifica che `WORKER_URL` sia corretto
- Controlla che il worker sia deployato

### Errore CORS

- Il worker include già header CORS
- Se usi un proxy, assicurati che passi gli header

### Sessione persa dopo refresh

- Verifica che localStorage non sia disabilitato
- Controlla di non cancellare localStorage accidentalmente

---

## 📚 Esempi Completi

Gli esempi completi sono inclusi nella cartella `login_worker`:

- `login.html` - Pagina di login standalone
- `index.html` - Dashboard con monitoraggio

---

**Hai completato l'integrazione!** 🎉

Per qualsiasi problema, consulta la documentazione Cloudflare o apri un issue.
