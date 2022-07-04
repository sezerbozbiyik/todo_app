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
  updateDoc,
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

// create instance dom element
const addTodoForm = document.querySelector("form.add");
const todoList = document.querySelector("ul.todos");
const registerForm = document.querySelector("#register");
const loginForm = document.querySelector("#login");
const authNavbar = document.querySelector("#auth");
const alert = document.querySelector(".alert");
const loginAlert = document.querySelector(".loginAlert");
const registerAlert = document.querySelector(".registerAlert");

// create list html template
const listTodos = (todos) => {
  let html = "";
  todos.forEach((d) => {
    html += `
    <li class="list-group-item list-group-item-action" id="${d.id}">
      <input class="form-check-input me-1" type="checkbox" ${
        d.isDone ? "checked" : null
      }>
      <span>${d.todo}</span>
      <i class="bi bi-pencil-square" id='edit' data-bs-toggle="modal" data-bs-whatever="${
        d.todo
      }" data-bs-target="#editModal"></i>
      <i class="bi bi-trash-fill" id='delete'></i>
    </li>`;
  });
  todoList.innerHTML = html;
};

// add new todo
addTodoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newTodo = e.target.newTodo.value.trim();
  const now = new Date();
  const userId = localStorage.getItem("uid");

  addDoc(colRef, {
    uid: userId,
    todo: newTodo,
    created_at: now,
  }).then(() => addTodoForm.reset());
});

// create auth alert message
const authAlert = (code) => {
  if (code === "auth/invalid-email") {
    return "Hatalı mail adresi girdiniz.";
  } else if (code === "auth/internal-error") {
    return "Lütfen şifrenizi giriniz.";
  } else if (code === "auth/user-not-found") {
    return "Böyle bir kullanıcı bulunamadı.";
  } else if (code === "auth/wrong-password") {
    return "Şifrenizi yanlış girdiniz.";
  } else if (code === "auth/weak-password") {
    return "Şifreniz en az 6 karakter uzunluğunda olmalıdır.";
  } else if (code === "auth/email-already-in-use") {
    return "Bu mail adresi zaten mevcut.";
  } else if (code === "auth/missing-email") {
    return "Lütfen mail adresinizi giriniz.";
  } else if (code === "auth/too-many-requests") {
    return "Birden fazla hatalı giriş gerçekleşti. Yeniden denemek için bekleyiniz.";
  }
};

// delete and update todo
todoList.addEventListener("click", (e) => {
  // update
  if (e.target.tagName === "INPUT") {
    const docRef = doc(db, "todos", e.target.parentElement.id);
    updateDoc(docRef, {
      isDone: e.target.checked,
    });
  }

  // delete
  if (e.target.id === "delete") {
    const docRef = doc(db, "todos", e.target.parentElement.id);
    deleteDoc(docRef);
  }
});

//register user
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.pwd.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      registerForm.submit();
    })
    .catch((err) => {
      console.log(err.code);
      registerAlert.textContent = authAlert(err.code);
      registerAlert.classList.remove("d-none");
    });
});

// login user
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.pwd.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginForm.submit();
    })
    .catch((err) => {
      console.log(err.code);
      loginAlert.textContent = authAlert(err.code);
      loginAlert.classList.remove("d-none");
    });
});

// user listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    addTodoForm.classList.remove("d-none");
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
    alert.classList.remove("d-none");
    authNavbar.innerHTML = `
      <a class="btn btn-sm btn-primary mx-2" data-bs-toggle="modal" data-bs-target="#loginModal">Login</a>
      <a class="btn btn-sm btn-outline-success" data-bs-toggle="modal" data-bs-target="#registerModal">Register</a>
    `;
    localStorage.removeItem("uid");
  }
});

// show edit modal
const editModal = document.getElementById("editModal");
editModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;

  const value = button.getAttribute("data-bs-whatever");

  const modalBodyInput = editModal.querySelector(".modal-body input");
  const editForm = editModal.querySelector("form#edit");

  modalBodyInput.value = value;
  const docRef = doc(db, "todos", event.relatedTarget.parentElement.id);

  // edit todo
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();

    updateDoc(docRef, {
      todo: e.target.todo.value,
    }).then(() => {
      editForm.submit();
    });
  });
});
