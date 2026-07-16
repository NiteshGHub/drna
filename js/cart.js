// Bisty Bakery - cart (localStorage) + shared navbar cart UI
(function (window) {
    "use strict";

    var STORAGE_KEY = "bisty_cart";

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        renderCartBadge();
        renderCartOffcanvas();
    }

    function isSameLine(item, productId, flavour) {
        return item.product_id === productId && (item.flavour || null) === (flavour || null);
    }

    function addToCart(product, qty, flavour) {
        qty = qty || 1;
        flavour = flavour || null;
        var cart = getCart();
        var existing = cart.find(function (i) { return isSameLine(i, product.id, flavour); });
        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                flavour: flavour,
                quantity: qty
            });
        }
        saveCart(cart);
    }

    function updateQty(productId, flavour, qty) {
        var cart = getCart();
        var item = cart.find(function (i) { return isSameLine(i, productId, flavour); });
        if (!item) return;
        item.quantity = qty;
        if (item.quantity <= 0) {
            cart = cart.filter(function (i) { return !isSameLine(i, productId, flavour); });
        }
        saveCart(cart);
    }

    function removeFromCart(productId, flavour) {
        var cart = getCart().filter(function (i) { return !isSameLine(i, productId, flavour); });
        saveCart(cart);
    }

    function clearCart() {
        saveCart([]);
    }

    function cartCount() {
        return getCart().reduce(function (sum, i) { return sum + i.quantity; }, 0);
    }

    function cartTotal() {
        return getCart().reduce(function (sum, i) { return sum + i.quantity * i.price; }, 0);
    }

    function renderCartBadge() {
        document.querySelectorAll(".bisty-cart-count").forEach(function (el) {
            var count = cartCount();
            el.textContent = count;
            el.style.display = count > 0 ? "inline-flex" : "none";
        });
    }

    function renderCartOffcanvas() {
        var body = document.getElementById("cartOffcanvasBody");
        var footer = document.getElementById("cartOffcanvasFooter");
        if (!body) return;

        var cart = getCart();
        if (cart.length === 0) {
            body.innerHTML = '<p class="text-center text-muted my-5">Your cart is empty.</p>';
            if (footer) footer.style.display = "none";
            return;
        }

        var html = "";
        cart.forEach(function (item, index) {
            var imgSrc = window.BistyAPI ? window.BistyAPI.imageUrl(item.image_url) : "img/product-1.jpg";
            html += '<div class="d-flex align-items-center border-bottom py-3" data-line="' + index + '">' +
                '<img src="' + encodeURI(imgSrc) + '" class="rounded" style="width:60px;height:60px;object-fit:cover;" alt="">' +
                '<div class="ms-3 flex-grow-1">' +
                '<h6 class="mb-1">' + item.name + (item.flavour ? ' <small class="text-muted">(' + item.flavour + ')</small>' : '') + '</h6>' +
                '<span class="text-primary">Rs ' + item.price.toFixed(2) + '</span>' +
                '</div>' +
                '<div class="d-flex align-items-center me-2">' +
                '<button class="btn btn-sm btn-outline-secondary bisty-qty-minus" data-line="' + index + '">-</button>' +
                '<span class="mx-2">' + item.quantity + '</span>' +
                '<button class="btn btn-sm btn-outline-secondary bisty-qty-plus" data-line="' + index + '">+</button>' +
                '</div>' +
                '<button class="btn btn-sm text-danger bisty-remove" data-line="' + index + '"><i class="fa fa-trash"></i></button>' +
                '</div>';
        });
        body.innerHTML = html;

        body.querySelectorAll(".bisty-qty-plus").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var item = getCart()[parseInt(btn.getAttribute("data-line"), 10)];
                if (item) updateQty(item.product_id, item.flavour, item.quantity + 1);
            });
        });
        body.querySelectorAll(".bisty-qty-minus").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var item = getCart()[parseInt(btn.getAttribute("data-line"), 10)];
                if (item) updateQty(item.product_id, item.flavour, item.quantity - 1);
            });
        });
        body.querySelectorAll(".bisty-remove").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var item = getCart()[parseInt(btn.getAttribute("data-line"), 10)];
                if (item) removeFromCart(item.product_id, item.flavour);
            });
        });

        if (footer) {
            footer.style.display = "block";
            var totalEl = footer.querySelector(".bisty-cart-total");
            if (totalEl) totalEl.textContent = "Rs " + cartTotal().toFixed(2);
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        renderCartBadge();
        renderCartOffcanvas();
    });

    window.BistyCart = {
        getCart: getCart,
        addToCart: addToCart,
        updateQty: updateQty,
        removeFromCart: removeFromCart,
        clearCart: clearCart,
        cartCount: cartCount,
        cartTotal: cartTotal,
        renderCartBadge: renderCartBadge,
        renderCartOffcanvas: renderCartOffcanvas
    };
})(window);
