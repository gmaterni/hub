# 📦 Guida all'Installazione - Cloudflare Auth Worker

Questa guida ti accompagna passo-passo nell'installazione e configurazione del sistema di autenticazione su Cloudflare Workers.

---

## ⏱️ Tempo Stimato: 15 minuti

---

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere:

- [ ] Un account Cloudflare (gratuito su https://dash.cloudflare.com/sign-up)
- [ ] **Node.js** versione 18 o superiore installato (Wrangler è un pacchetto Node)
- [ ] Un editor di testo (VS Code, Sublime, ecc.)

---

## 🚀 Procedura di Installazione

### Passo 1: Installa Wrangler CLI

Wrangler è lo strumento ufficiale di Cloudflare basato su Node.js per gestire i Workers.

```bash
npm install -g wrangler
```

Verifica l'installazione:

```bash
wrangler --version
```

---

### Passo 2: Sincronizzazione HTML (Importante!)

Il file `worker.js` contiene la logica del sistema ma anche il codice HTML delle pagine (`LOGIN_HTML` e `INDEX_HTML`).

Se vuoi usare le versioni grafiche curate (`login.html` e `index.html` presenti nella cartella), devi copiarne il contenuto all'interno del file `worker.js`:

1.  Apri `login.html`, copia tutto il testo e incollalo come valore della variabile `const LOGIN_HTML = \`...\`;` in `worker.js`.
2.  Fai lo stesso per `index.html` con la variabile `const INDEX_HTML`.

> **Nota:** Se modifichi i file `.html` nella cartella senza aggiornare `worker.js`, le modifiche non appariranno online dopo il deploy.

---

### Passo 3: Autenticati con Cloudflare

```bash
wrangler login
```

Si aprirà il browser. Accedi con il tuo account Cloudflare e autorizza Wrangler.

Dopo l'autorizzazione, torna al terminale: dovresti vedere **"Successfully logged in"**.

---

### Passo 3: Inizializza il Progetto (Opzionale)

Se non hai già una configurazione:

```bash
cd login_worker
wrangler init --from-dash login-service
```

*Se hai già `wrangler.toml`, salta questo passo.*

---

### Passo 4: Crea i KV Namespace

Il sistema usa due namespace KV: uno per gli utenti e uno per i log.

#### Crea namespace USERS:

```bash
wrangler kv namespace create USERS
```

**Output di esempio:**
```
✨ Success! Created namespace "login-service-USERS" with id "a1b2c3d4e5f6..."
```

Copia l'ID (`a1b2c3d4e5f6...`).

#### Crea namespace LOGS:

```bash
wrangler kv:namespace create LOGS
```

**Output di esempio:**
```
✨ Success! Created namespace "login-service-LOGS" with id "f6e5d4c3b2a1..."
```

Copia anche questo ID.

---

### Passo 5: Configura wrangler.toml

Apri il file `wrangler.toml` e sostituisci i placeholder con gli ID copiati:

```toml
name = "login-service"
main = "worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "USERS"
id = "a1b2c3d4e5f6..."        # ← Incolla qui ID di USERS
preview_id = "a1b2c3d4e5f6..."  # ← Stesso ID per preview

[[kv_namespaces]]
binding = "LOGS"
id = "f6e5d4c3b2a1..."        # ← Incolla qui ID di LOGS
preview_id = "f6e5d4c3b2a1..."  # ← Stesso ID per preview
```

Salva il file.

---

### Passo 6: Deploy del Worker

```bash
wrangler deploy
```

**Output di esempio:**
```
Total Upload: 12.5 KiB / gzip: 4.2 KiB
Uploaded login-service (2.34 sec)
Published login-service (0.45 sec)
  https://login-service.tuo-subdomain.workers.dev
```

L'URL mostrato è il tuo **endpoint di autenticazione**. Salvalo!

---

### Passo 7: Verifica il Funzionamento

Apri nel browser l'URL del worker:

```
https://login-service.tuo-subdomain.workers.dev/login
```

Dovresti vedere la pagina di login.

---

## ✅ Checklist Post-Installazione

- [ ] Wrangler installato e autenticato
- [ ] KV namespace USERS creato
- [ ] KV namespace LOGS creato
- [ ] wrangler.toml configurato con gli ID corretti
- [ ] Deploy completato senza errori
- [ ] Pagina di login accessibile via browser

---

## 🔧 Personalizzazione (Opzionale)

### Cambiare il Nome del Worker

Se vuoi un nome diverso da `login-service`:

1. Modifica `wrangler.toml`:
   ```toml
   name = "mio-auth-worker"
   ```

2. Rideploy:
   ```bash
   wrangler deploy
   ```

### Usare un Dominio Personalizzato

Se hai un dominio su Cloudflare:

1. Vai su **Workers & Pages** → Il tuo worker → **Triggers**
2. Sotto **Custom Domains**, clicca **Add Custom Domain**
3. Inserisci il dominio (es. `auth.tuosito.com`)
4. Cloudflare configurerà automaticamente DNS e SSL

---

## 🧪 Test Locale

Prima di fare deploy in produzione, puoi testare in locale:

```bash
wrangler dev
```

Il worker sarà disponibile su `http://localhost:8787`.

Per testare il login:
1. Apri `http://localhost:8787/login`
2. Registrati con una email
3. Fai il login
4. Verifica che vieni reindirizzato

---

## 📊 Verifica i KV Namespace

Per vedere i dati salvati:

```bash
# Lista tutte le chiavi in USERS
wrangler kv:key list --binding=USERS

# Leggi un utente specifico
wrangler kv:key get --binding=USERS "user@example.com"

# Lista tutte le chiavi in LOGS
wrangler kv:key list --binding=LOGS
```

---

## 🐛 Risoluzione Problemi

### Errore: "Authentication required"
```bash
wrangler login
```

### Errore: "KV namespace not found"
- Verifica di aver copiato gli ID corretti in `wrangler.toml`
- Assicurati di aver salvato il file dopo la modifica

### Errore: "Port 8787 already in use"
```bash
# Usa una porta diversa
wrangler dev --port 8788
```

### Il deploy fallisce con "script size too large"
- Il piano gratuito ha un limite di 1 MB
- Il worker attuale è ~13 KB, ben sotto il limite

### Errore CORS in locale
- Assicurati che le pagine HTML usino `http://localhost:8787` come WORKER_URL

---

## 📞 Comandi Utili

| Comando | Descrizione |
|---------|-------------|
| `wrangler deploy` | Deploy in produzione |
| `wrangler dev` | Test locale |
| `wrangler tail` | Vedi log in tempo reale |
| `wrangler --version` | Verifica versione |
| `wrangler login` | Autenticati |
| `wrangler logout` | Disconnettiti |
| `wrangler kv:key list --binding=USERS` | Lista chiavi KV |
| `wrangler kv:key delete --binding=USERS "chiave"` | Elimina chiave |

---

## 📈 Monitoraggio del Worker

Dopo il deploy, puoi monitorare l'utilizzo:

1. Vai su **Workers & Pages** nel dashboard Cloudflare
2. Clicca sul tuo worker
3. Sezione **Analytics**: vedi richieste, errori, tempi di risposta

---

## 🔐 Backup dei Dati

Per esportare i dati KV:

```bash
# Esporta tutti gli utenti
wrangler kv:key list --binding=USERS | while read key; do
    wrangler kv:key get --binding=USERS "$key" >> users-backup.json
done
```

---

## 🆙 Aggiornamenti

Per aggiornare il worker dopo modifiche:

```bash
# Modifica worker.js o altri file
wrangler deploy
```

Il nuovo deploy sovrascrive la versione precedente senza downtime.

---

## 📚 Risorse Utili

- [Documentazione Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentazione KV](https://developers.cloudflare.com/kv/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/)

---

**Installazione completata!** 🎉

Procedi con la lettura di `UTILIZZO.md` per integrare il sistema nelle tue applicazioni.
