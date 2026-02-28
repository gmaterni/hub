# Guida "Single-File" Login Google OAuth (Modern JS)

Questa guida permette di aggiungere un login Google a qualunque app web in 2 passaggi, usando sintassi ES6+.

## Passaggio 1: Crea il file `login.html`
Copia questo file nella cartella della tua app.

```html
<!-- login.html -->
<body>
    <div id="g_signin"></div>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <script>
        const CLIENT_ID = '387282319504-snlehr8cirvenc82hrpso9pipf3f3qds.apps.googleusercontent.com';
        
        const handleGoogleResponse = (r) => {
            const payload = r.credential.split('.')[1];
            const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            localStorage.setItem('user_web_id', decoded.email);
            window.location.replace('index.html');
        };

        window.onload = () => {
            google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleGoogleResponse });
            google.accounts.id.renderButton(document.getElementById("g_signin"), { theme: "filled_blue", size: "large" });
        };
    </script>
</body>
```

## Passaggio 2: Proteggi la tua `index.html`
Incolla questo script all'inizio del tag `<head>` del tuo file principale.

```html
<head>
    <script>
        if (!localStorage.getItem('user_web_id')) window.location.replace('login.html');
    </script>
</head>
```
