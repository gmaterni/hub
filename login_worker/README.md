# Cloudflare Worker Auth - login_worker

Sistema di autenticazione che **simula OAuth Google** utilizzando un **Cloudflare Worker** chiamato "login". Include **monitoraggio completo degli accessi** con geolocalizzazione, IP e user agent.

## 🏗️ Architettura

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   login.html    │────▶│  Cloudflare Worker   │◀───▶│  KV: USERS      │
│   (satellite)   │     │  (login-service)     │     │  KV: LOGS       │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  index.html     │
                        │  (dashboard)    │
                        └─────────────────┘
```

## ✨ Funzionalità

| Funzione | Descrizione |
|----------|-------------|
| 🔐 Login/Signup | Registrazione e autenticazione con email/password |
| 📊 Monitoraggio | Traccia tutti gli accessi con timestamp, IP, paese |
| 🌍 Geolocalizzazione | Rileva il paese dell'utente tramite Cloudflare |
| 👤 Dashboard | Panoramica accessi, log personali e log globali |
| 🪟 Popup Mode | Login in popup simile a OAuth Google |
| 💾 KV Storage | Dati persistenti su Cloudflare KV |

---

## 📋 Prerequisiti

1. **Account Cloudflare** (gratuito)
2. **Node.js** (versione 18 o superiore). 
   > **Nota:** Wrangler NON è un pacchetto Python, ma uno strumento Node.js.
3. **Wrangler CLI** installato globalmente tramite npm.

---

## 🚀 Architettura e Funzionamento

È importante capire che questo progetto ha una struttura "ibrida":

1.  **`worker.js`**: È il cuore del sistema. Contiene sia la logica backend (API) sia il codice HTML delle pagine (nelle costanti `LOGIN_HTML` e `INDEX_HTML`). Quando fai il deploy, Cloudflare userà solo quello che c'è dentro `worker.js`.
2.  **`index.html` e `login.html` (nella cartella)**: Sono versioni "evolute" e graficamente curate delle pagine. **Attenzione:** Modificare questi file NON aggiorna automaticamente il Worker. Se vuoi usare queste versioni, devi copiare il loro codice HTML dentro le costanti corrispondenti in `worker.js`.

---

## 🚀 Installazione e Deployment

### 1. Installa Wrangler CLI (Node.js)

Assicurati di avere Node.js installato, quindi esegui:
```bash
npm install -g wrangler
```

### 2. Autenticati con Cloudflare

```bash
wrangler login
```

### 3. Crea i KV Namespace (Obbligatorio)

Senza questo passaggio, il Worker non potrà salvare alcun dato e restituirà errori. Esegui questi comandi nel terminale:

```bash
# Crea il namespace per gli utenti
wrangler kv:namespace create USERS

# Crea il namespace per i log di accesso
wrangler kv:namespace create LOGS
```

Dopo ogni comando, Cloudflare ti restituirà un **ID** (una stringa lunga di numeri e lettere). **Copia questi ID immediatamente.**

### 4. Configura wrangler.toml

Apri il file `wrangler.toml` e sostituisci i valori segnaposto con gli ID che hai appena ottenuto:

```toml
[[kv_namespaces]]
binding = "USERS"
id = "INColla_QUI_ID_USERS"
preview_id = "INColla_QUI_ID_USERS"

[[kv_namespaces]]
binding = "LOGS"
id = "INColla_QUI_ID_LOGS"
preview_id = "INColla_QUI_ID_LOGS"
```

### 5. Deploy del Worker

```bash
wrangler deploy
```

Dopo il deploy, otterrai un URL come:
```
https://login-service.tuo-subdomain.workers.dev
```

---

## 🔧 Configurazione Siti Satellite

### Opzione A: Usa il Worker direttamente

I file `login.html` e `index.html` inclusi possono essere usati come template.

1. Apri `login.html`
2. Modifica `WORKER_URL` con l'URL del tuo worker:
   ```javascript
   const WORKER_URL = 'https://login-service.tuo-subdomain.workers.dev';
   ```
3. Apri `index.html`
4. Modifica anche lì `WORKER_URL`

### Opzione B: Integra in un sito esistente

Nel tuo sito esistente, aggiungi questo codice per il login:

```javascript
function openLoginPopup() {
    const authWindow = window.open(
        'https://login-service.tuo-subdomain.workers.dev/login',
        'CloudflareAuth',
        'width=450,height=550'
    );
    
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AUTH_SUCCESS') {
            localStorage.setItem('user_web_id', event.data.user_web_id);
            localStorage.setItem('auth_token', event.data.token);
            window.location.replace('/area-riservata.html');
        }
    });
}
```

---

## 📖 Utilizzo

### Per gli Utenti

1. Apri `login.html` (o la pagina di login del tuo sito)
2. Clicca su **"Accedi con Email"**
3. Si apre il popup del Worker
4. Inserisci email e password (o registrati)
5. Dopo il login, vieni reindirizzato alla dashboard

### Dashboard

La dashboard (`index.html`) include 3 sezioni:

| Tab | Descrizione |
|-----|-------------|
| **Panoramica** | Statistiche generali e ultimi 10 accessi |
| **I Miei Accessi** | Cronologia accessi del tuo account |
| **Tutti i Log** | Tutti gli accessi registrati (max 1000) |

---

## 🔌 API del Worker

### POST /api/auth

Autenticazione utente.

```json
// Request
{
  "action": "login",
  "email": "user@example.com",
  "password": "miaPassword"
}

// Response (successo)
{
  "success": true,
  "email": "user@example.com",
  "token": "eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDg3MTIwMDB9"
}
```

### GET /api/logs

Recupera tutti i log di accesso (per admin/monitoring).

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

## 🛡️ Sicurezza

### In Produzione

1. **Verifica origin nei messaggi**:
   ```javascript
   // In login.html
   const allowedOrigin = 'https://login-service.tuo-subdomain.workers.dev';
   if (event.origin !== allowedOrigin) return;
   ```

2. **Proteggi la dashboard dei log**:
   Aggiungi autenticazione admin in `worker.js`:
   ```javascript
   if (path === '/api/logs') {
       const authHeader = request.headers.get('Authorization');
       if (authHeader !== 'Bearer ADMIN_SECRET') {
           return jsonResponse({ error: 'Non autorizzato' }, 401);
       }
   }
   ```

3. **Usa HTTPS** per tutti i domini satellite

4. **Token JWT veri**: Sostituisci `generateToken()` con una libreria JWT

---

## 📊 Struttura Dati KV

### USERS
```json
{
  "email": "user@example.com",
  "createdAt": "2024-02-24T10:00:00.000Z",
  "lastLogin": "2024-02-24T12:30:00.000Z"
}
```

### LOGS (access_logs)
```json
[
  {
    "email": "user@example.com",
    "action": "login",
    "timestamp": "2024-02-24T12:30:00.000Z",
    "ip": "123.45.67.89",
    "country": "IT",
    "userAgent": "Mozilla/5.0..."
  }
]
```

---

## 🧪 Test Locale

```bash
# Avvia il worker in locale
wrangler dev
```

Il worker sarà disponibile su `http://localhost:8787`

Aggiorna `WORKER_URL` in `login.html` e `index.html`:
```javascript
const WORKER_URL = 'http://localhost:8787';
```

---

## 📝 Differenze con OAuth Google

| OAuth Google | Cloudflare Worker (questa soluzione) |
|--------------|-------------------------------------|
| Gestito da Google | Gestito da te |
| Nessun storage utenti | Storage completo su KV |
| Limitato a account Google | Qualsiasi email/password |
| **Nessun monitoraggio accessi** | **Monitoraggio completo** |
| Configurazione complessa | Setup semplice |
| Dipendenza da Google | Indipendente |

---

## 🔧 Comandi Utili

```bash
# Deploy
wrangler deploy

# Test locale
wrangler dev

# Vedi log del worker
wrangler tail

# Cancella KV namespace
wrangler kv:namespace delete USERS

# Importa dati in KV
wrangler kv:key put --binding=USERS "user@example.com" "{\"email\":\"user@example.com\"}"
```

---

## 📄 File

| File | Descrizione |
|------|-------------|
| `worker.js` | Cloudflare Worker principale |
| `wrangler.toml` | Configurazione Wrangler |
| `login.html` | Pagina login satellite (popup) |
| `index.html` | Dashboard con monitoraggio |
| `README.md` | Questa documentazione |

---

## 🆘 Troubleshooting

### Errore: "KV namespace not found"
- Hai inserito correttamente gli ID in `wrangler.toml`?
- Hai creato entrambi i namespace?

### Errore: "CORS error"
- Il worker include già header CORS, verifica che non ci siano proxy intermedi

### Il popup non si chiude dopo il login
- Controlla che `WORKER_URL` sia corretto
- Verifica che non ci siano blocker popup nel browser

### I log non vengono salvati
- Controlla che i binding KV siano configurati correttamente
- Verifica i log con `wrangler tail`

---

## 📞 Supporto

Per problemi o domande, consulta la [documentazione Cloudflare Workers](https://developers.cloudflare.com/workers/).
