# 🔐 Guida all'Architettura di Autorizzazione Cross-Domain

Questa cartella implementa un sistema di login centralizzato (**Hub-and-Spoke**). Un unico "Hub" gestisce l'autenticazione per infiniti siti "Satellite" che possono risiedere su domini diversi (es. GitHub Pages e Localhost).

---

## 🏗️ L'Architettura in breve

1.  **Hub Centrale (`hub/hub.html`)**: L'unico sito autorizzato nella Google Cloud Console. Gestisce il pulsante "Accedi con Google".
2.  **Satelliti (`sito_1`, `sito_2`, ecc.)**: Siti indipendenti che non hanno bisogno di configurazione Google. Chiedono all'Hub "Chi è questo utente?".

---

## 🔄 Sequenza di Autorizzazione (Login)

Il flusso segue una logica a "rimbalzo":

### 1. Controllo Iniziale (Satellite)
Quando l'utente apre il Satellite, uno script verifica se esiste un'identità salvata:
```javascript
if (!localStorage.getItem('user_web_id')) {
    // Se non loggato, rimbalza all'Hub passando l'URL corrente come ritorno
    window.location.replace('URL_HUB?redirect=' + encodeURIComponent(location.href));
}
```

### 2. Autenticazione (Hub)
L'utente arriva sull'Hub. L'Hub vede il parametro `redirect` nell'URL e sa dove dovrà rimandare l'utente dopo il login.
- L'utente clicca su **Accedi con Google**.
- Google restituisce le informazioni (email) all'Hub.

### 3. Ritorno al Satellite (Hub -> Satellite)
L'Hub estrae l'email e reindirizza l'utente al Satellite originale, "appiccicando" l'identità nell'URL:
```javascript
window.location.replace(targetURL + '?user_web_id=' + emailUtente);
```

### 4. Acquisizione e Pulizia (Satellite)
Il Satellite riceve l'utente, legge l'email dall'URL e la salva nel suo `localStorage` locale. Subito dopo, **pulisce l'URL** per sicurezza:
```javascript
const id = new URLSearchParams(window.location.search).get('user_web_id');
if (id) {
    localStorage.setItem('user_web_id', id);
    // Rimuove l'email dalla barra degli indirizzi senza ricaricare
    window.history.replaceState({}, document.title, window.location.pathname);
}
```

---

## 🚪 Sequenza di Logout

Il logout è progettato per essere semplice ma definitivo per il sito corrente:

1.  **Cancellazione**: L'applicazione chiama `localStorage.removeItem('user_web_id')`. Questo elimina l'identità dell'utente dal dominio del satellite.
2.  **Reset Stato**: Viene eseguito un `location.reload()`.
3.  **Rilevamento**: Poiché il `localStorage` è ora vuoto, lo script di controllo iniziale (punto 1 del Login) scatterà immediatamente.
4.  **Rinvio**: L'utente viene rispedito all'Hub, dove vedrà di nuovo la schermata "Accedi con Google".

---

## 🛡️ Considerazioni sulla Sicurezza

*   **Cross-Domain Isolation**: Poiché `localStorage` non è condiviso tra domini diversi, il logout sul `Sito 1` non disconnette automaticamente l'utente dal `Sito 2`. Ogni satellite gestisce la sua sessione locale.
*   **Token vs Email**: In questa implementazione didattica passiamo l'email. In un sistema di produzione, l'Hub passerebbe un **Token JWT** firmato che il satellite dovrebbe validare.
*   **Google Console**: Il grande vantaggio è che devi autorizzare solo `https://tuo-hub.github.io` nelle impostazioni Google, anche se hai 100 satelliti su domini diversi.

---

## 🎨 Note Grafiche
Per mantenere la coerenza visiva:
*   Tutti i siti usano un **Tema Dark** (#0a0a0a / #1a1a1a).
*   Le card di login e dashboard hanno un **Bordo Colorato** che identifica il sito (Blu per l'Hub, Azzurro per Sito 1, Verde per Sito 2).
