const Auth = {
    login: (u, p) => {
        const users = JSON.parse(localStorage.getItem(CONFIG.KEY_USERS)) || {};
        const user = users[u];
        if (user && user.password === p) {
            localStorage.setItem(CONFIG.KEY_ID, u);
            return true;
        }
        return false;
    },
    signup: (u, p) => {
        let users = JSON.parse(localStorage.getItem(CONFIG.KEY_USERS)) || {};
        users[u] = { username: u, password: p, createdAt: new Date().toISOString() };
        localStorage.setItem(CONFIG.KEY_USERS, JSON.stringify(users));
        localStorage.setItem(CONFIG.KEY_ID, u);
        return true;
    },
    kill: () => {
        document.querySelectorAll('input').forEach(i => { i.value = ""; i.type = "text"; });
    }
};
