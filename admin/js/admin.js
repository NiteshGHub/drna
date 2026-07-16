(function () {
    "use strict";

    var categories = [];
    var products = [];
    var productModal, passwordModal;

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.textContent = str == null ? "" : str;
        return div.innerHTML;
    }

    function formatDate(iso) {
        var d = new Date(iso);
        return d.toLocaleString();
    }

    // ---------- Auth guard ----------

    window.BistyAPI.get("/admin/me").catch(function () {
        window.location.href = "login.html";
    });

    document.getElementById("logout-btn").addEventListener("click", function () {
        window.BistyAPI.post("/admin/logout", {}).finally(function () {
            window.location.href = "login.html";
        });
    });

    // ---------- Products ----------

    function categoryName(categoryId) {
        var cat = categories.find(function (c) { return c.id === categoryId; });
        return cat ? cat.name : "-";
    }

    function populateCategorySelect() {
        var select = document.getElementById("product-category-select");
        select.innerHTML = categories.map(function (c) {
            return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>';
        }).join("");
    }

    function renderProductsTable() {
        var tbody = document.getElementById("products-table-body");
        tbody.innerHTML = products.map(function (p) {
            var imgSrc = window.BistyAPI.imageUrl(p.image_url);
            return '<tr>' +
                '<td><img src="' + encodeURI(imgSrc) + '" style="width:50px;height:50px;object-fit:cover;" class="rounded"></td>' +
                '<td>' + escapeHtml(p.name) + '</td>' +
                '<td>' + escapeHtml(categoryName(p.category_id)) + '</td>' +
                '<td>Rs ' + p.price.toFixed(2) + '</td>' +
                '<td>' + (p.is_available ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>') + '</td>' +
                '<td>' +
                '<button class="btn btn-sm btn-outline-primary me-1 edit-product-btn" data-id="' + p.id + '"><i class="fa fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-outline-danger delete-product-btn" data-id="' + p.id + '"><i class="fa fa-trash"></i></button>' +
                '</td>' +
                '</tr>';
        }).join("") || '<tr><td colspan="6" class="text-center text-muted py-4">No products yet.</td></tr>';

        tbody.querySelectorAll(".edit-product-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                openProductModal(parseInt(btn.getAttribute("data-id"), 10));
            });
        });
        tbody.querySelectorAll(".delete-product-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (!confirm("Delete this product?")) return;
                window.BistyAPI.del("/admin/products/" + btn.getAttribute("data-id")).then(loadProducts);
            });
        });
    }

    function loadProducts() {
        return Promise.all([
            window.BistyAPI.get("/categories"),
            window.BistyAPI.get("/admin/products")
        ]).then(function (results) {
            categories = results[0];
            products = results[1];
            populateCategorySelect();
            renderProductsTable();
        });
    }

    function openProductModal(productId) {
        var form = document.getElementById("product-form");
        form.reset();
        document.getElementById("product-form-error").classList.add("d-none");
        populateCategorySelect();

        if (productId) {
            var product = products.find(function (p) { return p.id === productId; });
            document.getElementById("productModalTitle").textContent = "Edit Product";
            form.product_id.value = product.id;
            form.name.value = product.name;
            form.category_id.value = product.category_id;
            form.price.value = product.price;
            form.description.value = product.description || "";
            form.flavours.value = (product.flavours || []).join(", ");
            form.is_available.checked = product.is_available;
        } else {
            document.getElementById("productModalTitle").textContent = "Add Product";
            form.product_id.value = "";
        }
        productModal.show();
    }

    document.getElementById("add-product-btn").addEventListener("click", function () {
        openProductModal(null);
    });

    document.getElementById("add-category-btn").addEventListener("click", function () {
        var name = prompt("New category name:");
        if (!name || !name.trim()) return;
        window.BistyAPI.post("/admin/categories", { name: name.trim(), slug: "", sort_order: categories.length + 1 })
            .then(function (cat) {
                categories.push(cat);
                populateCategorySelect();
                document.getElementById("product-category-select").value = cat.id;
            })
            .catch(function (err) {
                alert(err.message || "Could not create category");
            });
    });

    document.getElementById("product-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var form = e.target;
        var errorBox = document.getElementById("product-form-error");
        errorBox.classList.add("d-none");

        var formData = new FormData();
        formData.append("name", form.name.value.trim());
        formData.append("description", form.description.value.trim());
        formData.append("price", form.price.value);
        formData.append("category_id", form.category_id.value);
        formData.append("flavours", form.flavours.value.trim());
        formData.append("is_available", form.is_available.checked ? "true" : "false");
        formData.append("sort_order", "0");
        if (form.image.files[0]) {
            formData.append("image", form.image.files[0]);
        }

        var productId = form.product_id.value;
        var request = productId
            ? window.BistyAPI.putForm("/admin/products/" + productId, formData)
            : window.BistyAPI.postForm("/admin/products", formData);

        request.then(function () {
            productModal.hide();
            loadProducts();
        }).catch(function (err) {
            errorBox.textContent = err.message || "Could not save product";
            errorBox.classList.remove("d-none");
        });
    });

    // ---------- Orders ----------

    var STATUS_OPTIONS = ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

    function renderOrdersTable(orders) {
        var tbody = document.getElementById("orders-table-body");
        var newCount = orders.filter(function (o) { return o.status === "NEW"; }).length;
        var badge = document.getElementById("orders-badge");
        if (newCount > 0) {
            badge.textContent = newCount;
            badge.classList.remove("d-none");
        } else {
            badge.classList.add("d-none");
        }

        tbody.innerHTML = orders.map(function (o) {
            var itemsSummary = o.items.map(function (i) {
                return i.product_name + (i.flavour ? " (" + i.flavour + ")" : "") + " x" + i.quantity;
            }).join(", ");
            var statusOptions = STATUS_OPTIONS.map(function (s) {
                return '<option value="' + s + '"' + (s === o.status ? " selected" : "") + '>' + s.replace(/_/g, " ") + '</option>';
            }).join("");
            return '<tr>' +
                '<td>#' + o.id + '</td>' +
                '<td>' + escapeHtml(o.customer_name) + '<br><small class="text-muted">' + escapeHtml(o.address) + ', ' + escapeHtml(o.city) + ' - ' + escapeHtml(o.pincode) + '</small></td>' +
                '<td>' + escapeHtml(o.phone) + '</td>' +
                '<td style="max-width:250px;">' + escapeHtml(itemsSummary) + '</td>' +
                '<td>Rs ' + o.total_amount.toFixed(2) + '</td>' +
                '<td><select class="form-select form-select-sm order-status-select" data-id="' + o.id + '">' + statusOptions + '</select></td>' +
                '<td>' + formatDate(o.created_at) + '</td>' +
                '</tr>';
        }).join("") || '<tr><td colspan="7" class="text-center text-muted py-4">No orders yet.</td></tr>';

        tbody.querySelectorAll(".order-status-select").forEach(function (select) {
            select.addEventListener("change", function () {
                window.BistyAPI.patch("/admin/orders/" + select.getAttribute("data-id") + "/status", { status: select.value })
                    .then(loadOrders)
                    .catch(function (err) { alert(err.message || "Could not update status"); });
            });
        });
    }

    function loadOrders() {
        return window.BistyAPI.get("/admin/orders").then(renderOrdersTable);
    }

    // ---------- Contact ----------

    function renderContactTable(items) {
        var tbody = document.getElementById("contact-table-body");
        var unread = items.filter(function (i) { return !i.is_read; }).length;
        var badge = document.getElementById("contact-badge");
        if (unread > 0) { badge.textContent = unread; badge.classList.remove("d-none"); } else { badge.classList.add("d-none"); }

        tbody.innerHTML = items.map(function (i) {
            return '<tr' + (i.is_read ? '' : ' class="table-warning"') + '>' +
                '<td>' + escapeHtml(i.name) + '</td>' +
                '<td>' + escapeHtml(i.phone) + '</td>' +
                '<td>' + escapeHtml(i.email || "-") + '</td>' +
                '<td style="max-width:300px;">' + escapeHtml(i.message) + '</td>' +
                '<td>' + formatDate(i.created_at) + '</td>' +
                '<td>' + (i.is_read
                    ? '<span class="badge bg-secondary">Read</span>'
                    : '<button class="btn btn-sm btn-outline-primary mark-contact-read" data-id="' + i.id + '">Mark Read</button>') +
                '</td>' +
                '</tr>';
        }).join("") || '<tr><td colspan="6" class="text-center text-muted py-4">No inquiries yet.</td></tr>';

        tbody.querySelectorAll(".mark-contact-read").forEach(function (btn) {
            btn.addEventListener("click", function () {
                window.BistyAPI.patch("/admin/contact/" + btn.getAttribute("data-id") + "/read", {}).then(loadContact);
            });
        });
    }

    function loadContact() {
        return window.BistyAPI.get("/admin/contact").then(renderContactTable);
    }

    // ---------- Partners ----------

    function renderPartnersTable(items) {
        var tbody = document.getElementById("partners-table-body");
        var unread = items.filter(function (i) { return !i.is_read; }).length;
        var badge = document.getElementById("partners-badge");
        if (unread > 0) { badge.textContent = unread; badge.classList.remove("d-none"); } else { badge.classList.add("d-none"); }

        tbody.innerHTML = items.map(function (i) {
            return '<tr' + (i.is_read ? '' : ' class="table-warning"') + '>' +
                '<td>' + escapeHtml(i.business_name) + '</td>' +
                '<td>' + escapeHtml(i.contact_name) + '</td>' +
                '<td>' + escapeHtml(i.phone) + '</td>' +
                '<td>' + escapeHtml(i.city) + '</td>' +
                '<td style="max-width:300px;">' + escapeHtml(i.message || "-") + '</td>' +
                '<td>' + formatDate(i.created_at) + '</td>' +
                '<td>' + (i.is_read
                    ? '<span class="badge bg-secondary">Read</span>'
                    : '<button class="btn btn-sm btn-outline-primary mark-partner-read" data-id="' + i.id + '">Mark Read</button>') +
                '</td>' +
                '</tr>';
        }).join("") || '<tr><td colspan="7" class="text-center text-muted py-4">No inquiries yet.</td></tr>';

        tbody.querySelectorAll(".mark-partner-read").forEach(function (btn) {
            btn.addEventListener("click", function () {
                window.BistyAPI.patch("/admin/partners/" + btn.getAttribute("data-id") + "/read", {}).then(loadPartners);
            });
        });
    }

    function loadPartners() {
        return window.BistyAPI.get("/admin/partners").then(renderPartnersTable);
    }

    // ---------- Change password ----------

    document.getElementById("change-password-btn").addEventListener("click", function () {
        document.getElementById("password-form").reset();
        document.getElementById("password-form-error").classList.add("d-none");
        document.getElementById("password-form-success").classList.add("d-none");
        passwordModal.show();
    });

    document.getElementById("password-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var form = e.target;
        var errorBox = document.getElementById("password-form-error");
        var successBox = document.getElementById("password-form-success");
        errorBox.classList.add("d-none");
        successBox.classList.add("d-none");

        window.BistyAPI.post("/admin/change-password", {
            current_password: form.current_password.value,
            new_password: form.new_password.value
        }).then(function () {
            successBox.classList.remove("d-none");
            form.reset();
        }).catch(function (err) {
            errorBox.textContent = err.message || "Could not update password";
            errorBox.classList.remove("d-none");
        });
    });

    // ---------- Init ----------

    document.addEventListener("DOMContentLoaded", function () {
        productModal = new bootstrap.Modal(document.getElementById("productModal"));
        passwordModal = new bootstrap.Modal(document.getElementById("passwordModal"));
        loadProducts();
        loadOrders();
        loadContact();
        loadPartners();
    });
})();
