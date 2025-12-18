const apiProducts = "http://localhost:8080/products";
const apiOrders = "http://localhost:8080/orders";
const apiUsers = "http://localhost:8080/users";

const statusBox = document.getElementById("status");
const tableBody = document.getElementById("table-body");
const ordersTableBody = document.getElementById("orders-table-body");
const whoamiBox = document.getElementById("whoami");

function showStatus(text, isError = false) {
  statusBox.textContent = text;
  statusBox.style.display = "block";
  statusBox.classList.toggle("error", isError);
  setTimeout(() => (statusBox.style.display = "none"), 3500);
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

async function request(method, url, body) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        data.message || "Сталася помилка. Спробуйте ще раз або перевірте дані.";
      throw new Error(`${res.status}: ${message}`);
    }
    return data;
  } catch (err) {
    const friendly = err.message?.includes(":")
      ? err.message
      : "Сервіс тимчасово недоступний. Спробуйте пізніше.";
    showStatus(friendly, true);
    return null;
  }
}

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(u) {
  if (u) localStorage.setItem("currentUser", JSON.stringify(u));
  else localStorage.removeItem("currentUser");
  const card = document.getElementById("logout-btn");
  if (u) {
    whoamiBox.innerHTML = `<strong>${u.username}</strong> (ID: ${u.id})`;
    card.style.display = "inline-block";
  } else {
    whoamiBox.textContent = "не авторизований";
    card.style.display = "none";
  }
}

async function loadProducts(params = "") {
  const url = params ? `${apiProducts}${params}` : apiProducts;
  const data = await request("GET", url);
  if (data) renderProductsTable(data);
}

function renderProductsTable(items) {
  tableBody.innerHTML = "";
  if (!items || items.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" style="text-align:center; color:#999;">немає товарів</td></tr>';
    return;
  }
  items.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${item.id}</strong></td>
      <td>${item.title}</td>
      <td><small>${item.description || "—"}</small></td>
      <td><small>${item.category || "—"}</small></td>
      <td><strong>${item.price}₴</strong></td>
      <td>${item.quantity}</td>
      <td><small>ID ${item.ownerId}</small></td>
    `;
    tableBody.appendChild(tr);
  });
}

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = await request("POST", apiUsers, {
      username: f.username.value.trim(),
      email: f.email.value.trim(),
      fullName: f.fullName.value.trim(),
      password: f.password.value,
    });
    if (!data) return;
    showStatus("Реєстрація успішна");
  });

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const users = await request("GET", apiUsers);
  if (!users) return;
  const found = users.find(
    (u) =>
      u.username === f.username.value.trim() && u.password === f.password.value
  );
  if (!found) return showStatus("Невірний логін або пароль", true);
  setCurrentUser(found);
  showStatus(`Ви увійшли як ${found.username}`);
});

document.getElementById("logout-btn").addEventListener("click", () => {
  setCurrentUser(null);
  showStatus("Ви вийшли з акаунту");
});

document
  .getElementById("btn-load-all")
  .addEventListener("click", () => loadProducts());
document.getElementById("btn-load-mine").addEventListener("click", () => {
  const u = getCurrentUser();
  if (!u) return showStatus("Потрібна авторизація", true);
  loadProducts(`?ownerId=${u.id}`);
});

document
  .getElementById("btn-find-by-id")
  .addEventListener("click", async () => {
    const pid = Number(document.getElementById("find-product-id").value);
    if (!pid) return;
    const data = await request("GET", `${apiProducts}/${pid}`);
    if (!data) return;
    renderProductsTable([data]);
  });

document
  .getElementById("create-product-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const user = getCurrentUser();
    if (!user) return showStatus("Потрібна авторизація", true);
    const payload = {
      ownerId: user.id,
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      category: form.category.value.trim(),
      price: Number(form.price.value),
      quantity: Number(form.quantity.value),
      imageUrl: form.imageUrl.value.trim(),
      status: "active",
    };

    const data = await request("POST", apiProducts, payload);
    if (!data) return;
    form.reset();
    showStatus(`Створено продукт ID ${data.id}`);
    loadProducts();
  });

document
  .getElementById("delete-product-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = getCurrentUser();
    if (!u) return showStatus("Потрібна авторизація", true);
    const id = Number(e.target.id.value);
    const prod = await request("GET", `${apiProducts}/${id}`);
    if (!prod) return;
    if (prod.ownerId !== u.id)
      return showStatus("Ви не можете видаляти чужий товар", true);
    const data = await request("DELETE", `${apiProducts}/${id}`);
    if (data) {
      showStatus(`Видалено продукт ID ${id}`);
      loadProducts();
    }
  });

function renderOrdersTable(ordersList, allProducts) {
  ordersTableBody.innerHTML = "";
  if (!ordersList || ordersList.length === 0) {
    ordersTableBody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; color:#999;">немає замовлень</td></tr>';
    return;
  }

  ordersList.forEach((order) => {
    const product = allProducts.find((p) => p.id === order.productId) || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.id}</td>
      <td>${product.title || "—"}</td>
      <td>${order.status}</td>
      <td>${product.quantity || "—"}</td>
      <td>ID ${product.ownerId || "—"}</td>
    `;
    ordersTableBody.appendChild(tr);
  });
}

document.getElementById("btn-my-orders").addEventListener("click", async () => {
  const u = getCurrentUser();
  if (!u) return showStatus("Потрібна авторизація", true);

  const allProducts = await request("GET", apiProducts);
  if (!allProducts) return;

  const myOrders = await request("GET", `${apiOrders}/users/${u.id}`);
  if (!myOrders) return;

  renderOrdersTable(myOrders, allProducts);
});

document
  .getElementById("btn-create-order")
  .addEventListener("click", async () => {
    const u = getCurrentUser();
    if (!u) return showStatus("Потрібна авторизація", true);
    const productName = document
      .getElementById("order-product-name")
      .value.trim();
    if (!productName) return;

    const allProducts = await request("GET", apiProducts);
    if (!allProducts) return;
    const product = allProducts.find(
      (p) => p.title.toLowerCase() === productName.toLowerCase()
    );
    if (!product) return showStatus(`Товар "${productName}" не знайдено`, true);

    const data = await request("POST", apiOrders, {
      buyerId: u.id,
      productId: product.id,
    });
    if (data) {
      showStatus(
        `✓ Замовлення створено ID ${data.id} (товар: ${product.title})`
      );
      document.getElementById("order-product-name").value = "";
    }
  });

document
  .getElementById("btn-update-status")
  .addEventListener("click", async () => {
    const u = getCurrentUser();
    if (!u) return showStatus("Потрібна авторизація", true);
    const id = Number(document.getElementById("status-order-id").value);
    const status = document.getElementById("status-value").value.trim();
    if (!id || !status) return;
    const order = await request("GET", `${apiOrders}/${id}`);
    if (!order) return;
    if (order.buyerId !== u.id)
      return showStatus("Ви не можете змінювати чужі замовлення!", true);
    const data = await request("PUT", `${apiOrders}/${id}/${status}`);
    if (data) renderOrdersTable([data], await request("GET", apiProducts));
  });

document
  .getElementById("btn-cancel-order")
  .addEventListener("click", async () => {
    const u = getCurrentUser();
    if (!u) return showStatus("Потрібна авторизація", true);
    const id = Number(document.getElementById("cancel-order-id").value);
    if (!id) return;
    const order = await request("GET", `${apiOrders}/${id}`);
    if (!order) return;
    if (order.buyerId !== u.id)
      return showStatus("Ви не можете відміняти чужі замовлення!", true);
    const data = await request("DELETE", `${apiOrders}/${id}`);
    if (data) {
      showStatus(`✓ Замовлення ID ${id} скасовано`);

      const allProducts = await request("GET", apiProducts);
      const myOrders = await request("GET", `${apiOrders}/users/${u.id}`);
      renderOrdersTable(myOrders, allProducts);
    }
  });

setCurrentUser(getCurrentUser());
loadProducts();
