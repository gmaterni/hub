# 🛡️ AUTH_MANUALE

Specifica per l'implementazione del login classico con username e password.

## 📁 COMPONENTI
- `config.js`: Definisce le chiavi di storage local (`uaUserId1`, `app_users1`).
- `auth.js`: Gestisce `login(u, p)`, `signup(u, p)` e la pulizia dei campi.
- `login.html`: Interfaccia con form manuale e toggle "Mostra Password".
- `app.html`: Pagina protetta da App Guard.

## ⚙️ CONFIGURAZIONE (config.js)
```javascript
const CONFIG = {
    KEY_ID: 'uaUserId1',
    KEY_USERS: 'app_users1'
};
```

## 🔐 PROTEZIONE (App Guard)
Inserire nel `<head>` di `app.html`:
```html
<script src="config.js"></script>
<script>
    if (!localStorage.getItem(CONFIG.KEY_ID)) window.location.replace('login.html');
</script>
```

## 🚀 FLUSSO OPERATIVO
1. L'utente inserisce credenziali in `login.html`.
2. `auth.js` verifica la presenza dell'utente in `localStorage[CONFIG.KEY_USERS]`.
3. In caso di successo, salva lo username in `localStorage[CONFIG.KEY_ID]`.
4. Reindirizzamento a `app.html`.
