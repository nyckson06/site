import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updatePassword, signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getDatabase, ref, set, get, update, remove, onValue, push
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzj4sP6TvIg1kFAAZ3hrgy9KqAWkDCnx4",
  authDomain: "skotvidero.firebaseapp.com",
  databaseURL: "https://skotvidero-default-rtdb.firebaseio.com",
  projectId: "skotvidero",
  storageBucket: "skotvidero.appspot.com",
  messagingSenderId: "797827317952",
  appId: "1:797827317952:android:83ec9bb10d5a283826ed25"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

window.showRegister = () => {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
};
window.showLogin = () => {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
};

window.register = async () => {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  if (!email || !password) return alert("Preencha todos os campos.");
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    const username = "usuario" + Math.floor(Math.random() * 10000);
    await set(ref(db, 'users/' + uid), {
      email,
      cargo: "usuario",
      username,
      banido: false
    });
    alert("Conta criada. Faça login.");
    showLogin();
  } catch (e) {
    alert("Erro: " + e.message);
  }
};

window.login = async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const snap = await get(ref(db, "users/" + uid));
    const data = snap.val();
    if (data.banido) return alert("Você está banido.");
    document.getElementById("auth").style.display = "none";
    document.getElementById("shop").style.display = "block";
    document.getElementById("usernameInput").value = data.username || "";
    loadProducts(uid, data);
    if (data.cargo === "admin") loadAdminPanel();
  } catch (e) {
    alert("Erro: " + e.message);
  }
};

function loadProducts(uid, userData) {
  const produtos = [
    { nome: "Produto 1", preco: "R$ 49,99" },
    { nome: "Produto 2", preco: "R$ 89,90" }
  ];
  const div = document.getElementById("products");
  produtos.forEach((p, i) => {
    const box = document.createElement("div");
    box.className = "product";
    box.innerHTML = `
      <h2>${p.nome}</h2>
      <p>${p.preco}</p>
      <input id="coment-${i}" placeholder="Comente aqui..." />
      <button onclick="comentar('${p.nome}', ${i})">Comentar</button>
      <div id="comentarios-${i}"></div>
    `;
    div.appendChild(box);
    carregarComentarios(p.nome, i);
  });
}

function carregarComentarios(produto, index) {
  onValue(ref(db, "comentarios/" + produto), snap => {
    const div = document.getElementById("comentarios-" + index);
    div.innerHTML = "";
    snap.forEach(c => {
      const d = c.val();
      div.innerHTML += `<div class="comment"><strong>${d.username} (${d.cargo})</strong>: ${d.texto}</div>`;
    });
  });
}

window.comentar = async (produto, index) => {
  const user = auth.currentUser;
  const snap = await get(ref(db, "users/" + user.uid));
  const data = snap.val();
  const texto = document.getElementById("coment-" + index).value;
  if (!texto) return;
  await push(ref(db, "comentarios/" + produto), {
    username: data.username,
    cargo: data.cargo,
    texto
  });
  document.getElementById("coment-" + index).value = "";
};

window.atualizarNomeUsuario = async () => {
  const user = auth.currentUser;
  const nome = document.getElementById("usernameInput").value;
  await update(ref(db, "users/" + user.uid), { username: nome });
  alert("Nome atualizado.");
};

window.alterarSenha = async () => {
  const user = auth.currentUser;
  const senha = document.getElementById("newPassword").value;
  await updatePassword(user, senha);
  alert("Senha alterada.");
};

window.logout = async () => {
  await signOut(auth);
  location.reload();
};

window.toggleProfileMenu = () => {
  const menu = document.getElementById("profileMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

function loadAdminPanel() {
  document.getElementById("painelAdmin").style.display = "block";
  const lista = document.getElementById("users");
  onValue(ref(db, "users"), snap => {
    lista.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      lista.innerHTML += `
        <div class="user-card">
          <strong>${d.email}</strong> (${d.username}) - ${d.cargo}
          <button onclick="banir('${u.key}')">Banir</button>
          <button onclick="remover('${u.key}')">Remover</button>
        </div>
      `;
    });
  });
}

window.banir = async (uid) => {
  await update(ref(db, "users/" + uid), { banido: true });
};
window.remover = async (uid) => {
  await remove(ref(db, "users/" + uid));
};