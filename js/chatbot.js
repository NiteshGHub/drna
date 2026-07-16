// Bisty Bakery - simple rule-based FAQ chat widget (no LLM, no backend calls)
(function (window, document) {
    "use strict";

    var WHATSAPP_NUMBER = "917415842447";

    var TOPICS = [
        {
            label: "Our Products",
            reply: 'We bake breads, cakes and more — see the full range with live prices on our ' +
                '<a href="products.html">Products page</a>.'
        },
        {
            label: "How do I place an order?",
            reply: 'Add items to your cart from the <a href="products.html">Products page</a>, then head to checkout. ' +
                'After you submit your delivery details, our team confirms the order and payment with you on WhatsApp.'
        },
        {
            label: "Delivery",
            reply: "We deliver pan-India from our factory in Sagar, Madhya Pradesh. Just enter your address and pincode at checkout."
        },
        {
            label: "Become a Partner/Distributor",
            reply: 'Interested in stocking Bisty Bakery products or becoming a distributor in your area? ' +
                'Tell us about your business on our <a href="partner.html">Partner With Us page</a> and our team will reach out.'
        },
        {
            label: "Contact Us",
            reply: 'You can reach us at Industrial Area, Chanatariya, Sagar, Madhya Pradesh - 470004, or via our ' +
                '<a href="contact.html">Contact page</a>.'
        }
    ];

    var WHATSAPP_TOPIC = {
        label: "Talk to a human on WhatsApp",
        isWhatsApp: true
    };

    function whatsappLink() {
        var message = "Hi Bisty Bakery, I have a question.";
        return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    }

    function buildWidget() {
        var launcher = document.createElement("button");
        launcher.className = "bisty-chat-launcher";
        launcher.setAttribute("aria-label", "Open chat");
        launcher.innerHTML = '<i class="fa fa-comment-dots"></i>';

        var panel = document.createElement("div");
        panel.className = "bisty-chat-panel d-none";
        panel.innerHTML =
            '<div class="bisty-chat-header">' +
                '<span>Chat with Bisty Bakery</span>' +
                '<button type="button" class="bisty-chat-close" aria-label="Close chat">&times;</button>' +
            '</div>' +
            '<div class="bisty-chat-log"></div>' +
            '<div class="bisty-chat-topics"></div>';

        document.body.appendChild(launcher);
        document.body.appendChild(panel);

        var log = panel.querySelector(".bisty-chat-log");
        var topicsBox = panel.querySelector(".bisty-chat-topics");
        var closeBtn = panel.querySelector(".bisty-chat-close");

        function addMessage(text, from) {
            var bubble = document.createElement("div");
            bubble.className = "bisty-chat-bubble " + (from === "user" ? "bisty-chat-bubble-user" : "bisty-chat-bubble-bot");
            bubble.innerHTML = text;
            log.appendChild(bubble);
            log.scrollTop = log.scrollHeight;
        }

        function renderMainMenu() {
            topicsBox.innerHTML = "";
            TOPICS.concat([WHATSAPP_TOPIC]).forEach(function (topic) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "bisty-chat-topic-btn" + (topic.isWhatsApp ? " bisty-chat-topic-btn-whatsapp" : "");
                btn.textContent = topic.label;
                btn.addEventListener("click", function () {
                    if (topic.isWhatsApp) {
                        window.open(whatsappLink(), "_blank");
                        return;
                    }
                    addMessage(topic.label, "user");
                    addMessage(topic.reply, "bot");
                    renderBackToMenu();
                });
                topicsBox.appendChild(btn);
            });
        }

        function renderBackToMenu() {
            topicsBox.innerHTML = "";
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "bisty-chat-topic-btn";
            btn.textContent = "Main Menu";
            btn.addEventListener("click", renderMainMenu);
            topicsBox.appendChild(btn);
        }

        function openPanel() {
            panel.classList.remove("d-none");
            if (!log.children.length) {
                addMessage("Hi! I'm the Bisty Bakery bot. What can I help you with?", "bot");
                renderMainMenu();
            }
        }

        function closePanel() {
            panel.classList.add("d-none");
        }

        launcher.addEventListener("click", function () {
            if (panel.classList.contains("d-none")) {
                openPanel();
            } else {
                closePanel();
            }
        });
        closeBtn.addEventListener("click", closePanel);
    }

    document.addEventListener("DOMContentLoaded", buildWidget);
})(window, document);
