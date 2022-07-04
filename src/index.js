import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";

import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCzxBTZxA9ZDT2fSgX5MfxgDFFWA5WU8wc",
  authDomain: "my-todo-app-635ba.firebaseapp.com",
  projectId: "my-todo-app-635ba",
  storageBucket: "my-todo-app-635ba.appspot.com",
  messagingSenderId: "598859627487",
  appId: "1:598859627487:web:52316a7053e6dc99d9a26a",
};

// init firebase app
const app = initializeApp(firebaseConfig);

// init services
const db = getFirestore(app);
const auth = getAuth(app);

// collection ref
const colRef = collection(db, "todos");

// query selection
const userId = localStorage.getItem("uid");
const q = query(colRef, where("uid", "==", userId), orderBy("created_at"));

// create list html template
const listTodos = (todos) => {
  let html = "";
  todos.forEach((d) => {
    html += `
    <li class="list-group-item list-group-item-action" id="${d.id}">
      ${d.todo}
      <i class="bi bi-trash-fill"></i>
    </li>`;
  });
  todoList.innerHTML = html;
};

// add new todo
const addTodoForm = document.querySelector("form.add");
const loginAlert = document.createElement("div");
addTodoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newTodo = e.target.newTodo.value.trim();
  const now = new Date();
  const userId = localStorage.getItem("uid");

  if (userId) {
    addDoc(colRef, {
      uid: userId,
      todo: newTodo,
      created_at: now,
    }).then(() => addTodoForm.reset());
  } else {
    addTodoForm.reset()
    loginAlert.textContent = "!!! Lütfen Önce Giriş Yapınız. !!!";
    loginAlert.classList.add("bg-danger", "text-light", "p-1");
    addTodoForm.after(loginAlert);
  }
});

// delete todo
const todoList = document.querySelector("ul.todos");
todoList.addEventListener("click", (e) => {
  if (e.target.tagName === "I") {
    const docRef = doc(db, "todos", e.target.parentElement.id);
    deleteDoc(docRef);
  }
});

//register user
const registerForm = document.querySelector("#register");
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.pwd.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      registerForm.submit();
    })
    .catch((err) => {
      console.log(err.message);
    });
});

// login user
const loginForm = document.querySelector("#login");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.pwd.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginForm.submit();
    })
    .catch((err) => {
      console.log(err.message);
    });
});

// user listener
const authNavbar = document.querySelector("#auth");
const alert = document.querySelector(".alert");
onAuthStateChanged(auth, (user) => {
  if (user) {
    alert.classList.add("d-none");
    authNavbar.innerHTML = `
      <span class="text-light">${user.email}</span>
      <a href="" class="text-white-50 my-2 signout">sign out</a>
    `;
    localStorage.setItem("uid", user.uid);

    // get collection data
    onSnapshot(q, (snapshot) => {
      const todos = [];
      snapshot.docs.forEach((doc) => {
        todos.push({ ...doc.data(), id: doc.id });
      });
      listTodos(todos);
    });

    // logout user
    const logoutBtn = document.querySelector(".signout");
    logoutBtn.addEventListener("click", (e) => {
      signOut(auth)
        .then(() => {})
        .catch((err) => {
          console.log(err);
        });
    });
  } else {
    authNavbar.innerHTML = `
      <a class="btn btn-sm btn-primary mx-2" data-bs-toggle="modal" data-bs-target="#loginModal">Login</a>
      <a class="btn btn-sm btn-outline-success" data-bs-toggle="modal" data-bs-target="#registerModal">Register</a>
    `;
    localStorage.removeItem("uid");
  }
});
