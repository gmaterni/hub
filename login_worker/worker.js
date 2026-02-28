/**
 * Cloudflare Worker - Login Service
 * Simula OAuth Google con monitoraggio accessi
 */

// HTML per la pagina di login (servita direttamente dal worker)
const LOGIN_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <style>
        body { background: #0a0a0a; color: #e0e0e0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1a1a1a; padding: 40px; border-radius: 8px; border: 1px solid #2a2a2a; text-align: center; width: 320px; }
        input { width: 100%; padding: 12px; margin: 10px 0; background: #0a0a0a; border: 1px solid #333; color: white; box-sizing: border-box; border-radius: 4px; }
        button { width: 100%; padding: 12px; background: #4a9eff; border: none; color: white; cursor: pointer; border-radius: 4px; font-size: 16px; margin-top: 10px; }
        button:hover { background: #357abd; }
        .toggle { margin-top: 15px; font-size: 0.9em; color: #888; cursor: pointer; }
        span { color: #4a9eff; }
        .error { color: #ff5555; margin-top: 10px; font-size: 0.9em; }
        h2 { margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <h2 id="title">Login</h2>
        <input type="email" id="email" placeholder="Email" autocomplete="off">
        <input type="password" id="password" placeholder="Password" autocomplete="new-password">
        <div id="confirmField" style="display:none">
            <input type="password" id="confirm" placeholder="Conferma Password" autocomplete="new-password">
        </div>
        <button id="submitBtn">Accedi</button>
        <div id="error" class="error"></div>
        <div class="toggle" id="toggleMode">Non hai un account? <span>Registrati</span></div>
    </div>
    <script>
        let isSignup = false;
        const toggle = document.getElementById('toggleMode');
        const title = document.getElementById('title');
        const submitBtn = document.getElementById('submitBtn');
        const confirmField = document.getElementById('confirmField');
        const errorDiv = document.getElementById('error');
        
        toggle.onclick = () => {
            isSignup = !isSignup;
            title.innerText = isSignup ? 'Registrati' : 'Login';
            submitBtn.innerText = isSignup ? 'Registrati' : 'Accedi';
            confirmField.style.display = isSignup ? 'block' : 'none';
            toggle.innerHTML = isSignup ? 
                '<span>Torna al Login</span>' : 
                'Non hai un account? <span>Registrati</span>';
            errorDiv.innerText = '';
        };
        
        submitBtn.onclick = async () => {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm').value;
            
            if (!email || !password) {
                errorDiv.innerText = 'Compila tutti i campi';
                return;
            }
            
            if (isSignup && password !== confirm) {
                errorDiv.innerText = 'Le password non coincidono';
                return;
            }
            
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: isSignup ? 'signup' : 'login',
                        email,
                        password
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Comunica con la finestra opener se esiste (popup mode)
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'AUTH_SUCCESS',
                            user_web_id: data.email,
                            token: data.token
                        }, '*');
                        window.close();
                    } else {
                        localStorage.setItem('user_web_id', data.email);
                        localStorage.setItem('auth_token', data.token);
                        window.location.replace('/index.html');
                    }
                } else {
                    errorDiv.innerText = data.error || 'Errore';
                }
            } catch (e) {
                errorDiv.innerText = 'Errore di connessione';
            }
        };
        
        // Enter per submit
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitBtn.click();
        });
    </script>
</body>
</html>`;

// HTML per la pagina di logout
const LOGOUT_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Logout</title>
    <meta http-equiv="refresh" content="0;url=/login.html">
    <style>
        body { background: #0a0a0a; color: #e0e0e0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    </style>
</head>
<body><p>Logout in corso...</p></body>
</html>`;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS headers per tutte le risposte
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
        
        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        
        // Serve login page
        if (path === '/login' || path === '/login.html' || path === '/') {
            return new Response(LOGIN_HTML, {
                headers: { 'Content-Type': 'text/html', ...corsHeaders }
            });
        }
        
        // Serve index page (area riservata)
        if (path === '/index' || path === '/index.html') {
            return new Response(INDEX_HTML, {
                headers: { 'Content-Type': 'text/html', ...corsHeaders }
            });
        }
        
        // Logout
        if (path === '/logout') {
            return new Response(LOGOUT_HTML, {
                headers: { 'Content-Type': 'text/html', ...corsHeaders }
            });
        }
        
        // API Auth endpoint
        if (path === '/api/auth' && request.method === 'POST') {
            try {
                const body = await request.json();
                const { action, email, password } = body;
                
                if (!email || !password) {
                    return jsonResponse({ error: 'Email e password richiesti' }, 400, corsHeaders);
                }
                
                const normalizedEmail = email.toLowerCase().trim();
                
                if (action === 'signup') {
                    // Registrazione nuovo utente
                    const existingUser = await env.USERS.get(normalizedEmail);
                    if (existingUser) {
                        return jsonResponse({ error: 'Utente già esistente' }, 400, corsHeaders);
                    }
                    
                    const userData = {
                        email: normalizedEmail,
                        createdAt: new Date().toISOString(),
                        lastLogin: null
                    };
                    
                    await env.USERS.put(normalizedEmail, JSON.stringify(userData));
                    
                    // Genera token semplice
                    const token = generateToken(normalizedEmail);
                    
                    // Log dell'accesso
                    await logAccess(env, normalizedEmail, 'signup', request);
                    
                    return jsonResponse({
                        success: true,
                        email: normalizedEmail,
                        token
                    }, 200, corsHeaders);
                    
                } else if (action === 'login') {
                    // Login utente esistente
                    const userStr = await env.USERS.get(normalizedEmail);
                    
                    if (!userStr) {
                        return jsonResponse({ error: 'Credenziali non valide' }, 401, corsHeaders);
                    }
                    
                    const user = JSON.parse(userStr);
                    
                    // Aggiorna lastLogin
                    user.lastLogin = new Date().toISOString();
                    await env.USERS.put(normalizedEmail, JSON.stringify(user));
                    
                    // Genera token
                    const token = generateToken(normalizedEmail);
                    
                    // Log dell'accesso
                    await logAccess(env, normalizedEmail, 'login', request);
                    
                    return jsonResponse({
                        success: true,
                        email: normalizedEmail,
                        token
                    }, 200, corsHeaders);
                }
                
                return jsonResponse({ error: 'Azione non valida' }, 400, corsHeaders);
                
            } catch (e) {
                console.error('Auth error:', e);
                return jsonResponse({ error: 'Errore interno' }, 500, corsHeaders);
            }
        }
        
        // API per ottenere i log di accesso (solo per admin/monitoring)
        if (path === '/api/logs' && request.method === 'GET') {
            try {
                const logs = await getAccessLogs(env);
                return jsonResponse({ logs }, 200, corsHeaders);
            } catch (e) {
                return jsonResponse({ error: 'Errore nel recupero log' }, 500, corsHeaders);
            }
        }
        
        // 404
        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};

// Genera un token semplice (in produzione usa JWT vero)
function generateToken(email) {
    const data = { email, iat: Date.now() };
    return btoa(JSON.stringify(data));
}

// Logga l'accesso nel KV
async function logAccess(env, email, action, request) {
    try {
        const logEntry = {
            email,
            action,
            timestamp: new Date().toISOString(),
            ip: request.headers.get('CF-Connecting-IP') || 'unknown',
            country: request.headers.get('CF-IPCountry') || 'unknown',
            userAgent: request.headers.get('User-Agent') || 'unknown'
        };
        
        // Recupera log esistenti
        const logsStr = await env.LOGS.get('access_logs') || '[]';
        const logs = JSON.parse(logsStr);
        
        // Aggiungi nuovo log (mantieni ultimi 1000)
        logs.unshift(logEntry);
        if (logs.length > 1000) logs.pop();
        
        await env.LOGS.put('access_logs', JSON.stringify(logs));
        
        // Aggiorna conteggio per email
        const emailLogsStr = await env.LOGS.get(\`log:\${email}\`) || '[]';
        const emailLogs = JSON.parse(emailLogsStr);
        emailLogs.unshift(logEntry);
        if (emailLogs.length > 100) emailLogs.pop();
        await env.LOGS.put(\`log:\${email}\`, JSON.stringify(emailLogs));
        
    } catch (e) {
        console.error('Log error:', e);
    }
}

// Recupera tutti i log
async function getAccessLogs(env) {
    const logsStr = await env.LOGS.get('access_logs') || '[]';
    return JSON.parse(logsStr);
}

// Helper per risposte JSON
function jsonResponse(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers }
    });
}

// HTML per l'area riservata (index.html)
const INDEX_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Area Riservata</title>
    <script>
        if (!localStorage.getItem('user_web_id')) window.location.replace('/login.html');
    </script>
    <style>
        body { background: #0a0a0a; color: #e0e0e0; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { background: #1a1a1a; padding: 30px; border-radius: 8px; border: 1px solid #2a2a2a; text-align: center; max-width: 500px; }
        b { color: #4a9eff; }
        button { margin-top: 20px; background: #ff5555; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #cc4444; }
        .info { margin-top: 20px; padding: 15px; background: #0a0a0a; border-radius: 4px; text-align: left; font-size: 0.9em; }
        .info p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Area Riservata</h1>
        <p>Benvenuto! Sei autenticato.</p>
        <p>Email: <b id="email"></b></p>
        <div class="info">
            <p><strong>Ultimo accesso:</strong> <span id="lastAccess">-</span></p>
            <p><strong>Token:</strong> <span id="token">-</span></p>
        </div>
        <button onclick="doLogout()">Logout</button>
    </div>
    <script>
        const email = localStorage.getItem('user_web_id');
        const token = localStorage.getItem('auth_token');
        document.getElementById('email').innerText = email;
        document.getElementById('token').innerText = token ? token.substring(0, 30) + '...' : '-';
        
        // Decodifica token per mostrare info
        if (token) {
            try {
                const decoded = JSON.parse(atob(token));
                const date = new Date(decoded.iat).toLocaleString('it-IT');
                document.getElementById('lastAccess').innerText = date;
            } catch(e) {}
        }
        
        function doLogout() {
            localStorage.removeItem('user_web_id');
            localStorage.removeItem('auth_token');
            window.location.replace('/logout');
        }
    </script>
</body>
</html>`;
