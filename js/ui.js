let currentMenuItem = null;

// --- Menu Rendering ---
function renderMenuItems(menuData) {
    const container = document.querySelector('.box-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!menuData || menuData.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center;">Sorry, the menu could not be loaded.</p>';
        return;
    }
    
    menuData.forEach(item => {
        const box = document.createElement('div');
        box.className = 'box reveal';
        box.innerHTML = `
            <img src="${item.imagePath}" alt="${item.name}" />
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <button class="btn" data-item-id="${item.id}">Add to cart</button>
        `;
        container.appendChild(box);
    });
}

// --- General UI ---
function toggleMobileNav() {
    document.getElementById('mobile-nav-menu').classList.toggle('active');
}

function updateCartBadge(count) {
    const badge = document.getElementById('cart-badge');
    if (!badge) {
        console.error('Cart badge element not found!');
        return;
    }
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

function updateAuthStateUI(user) {
    const authLink = document.getElementById('auth-link');
    const profileIcon = document.getElementById('profile-icon');
    if (user) {
        authLink.textContent = 'Logout';
        authLink.id = 'logout-link';
        profileIcon.style.display = 'inline-block';
    } else {
        authLink.textContent = 'Login';
        authLink.id = 'auth-link';
        profileIcon.style.display = 'none';
    }
}

// --- Toast Notifications ---
function showToast(message, type = 'info') { // types: info, success, error
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000); // Remove after 5 seconds
}

// --- Modals ---
const modals = {
    item: document.getElementById('itemModal'),
    cart: document.getElementById('cartModal'),
    auth: document.getElementById('authModal'),
    profile: document.getElementById('profileModal'),
};

function openModal(modalName, data) {
    if (!modals[modalName]) return;
    if (modalName === 'item' && data) populateItemModal(data);
    if (modalName === 'cart' && data) renderCart(data);
    if (modalName === 'profile' && data) populateProfileModal(data);
    modals[modalName].style.display = 'block';
}

function closeModal(modalName) {
    if (modals[modalName]) {
        modals[modalName].style.display = 'none';
    }
}

// --- Item Modal Logic ---
function populateItemModal(item) {
    currentMenuItem = item;
    const modal = modals.item;
    modal.querySelector('.modal-img').src = item.modalImagePath;
    modal.querySelector('.modal-title').textContent = `Add ${item.name} to Cart`;
    document.getElementById('itemForm').reset();
    updateItemPrice();
}

function updateItemPrice() {
    if (!currentMenuItem) return;
    const qty = parseInt(document.getElementById('fquan').value, 10) || 0;
    const filling = document.querySelector('#itemForm input[name="filling"]:checked');
    const priceDisplay = document.getElementById('total-price');
    if (!filling || qty <= 0) {
        priceDisplay.textContent = 'Rs. 0';
        return;
    }
    const pricePerPlate = currentMenuItem.prices[filling.value];
    priceDisplay.textContent = `Rs. ${qty * pricePerPlate}`;
}

// --- Cart Modal Logic (with CRUD) ---
function renderCart(cartItems) {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    let grandTotal = 0;

    if (cartItems.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        document.getElementById('place-order-btn').style.display = 'none';
    } else {
        document.getElementById('place-order-btn').style.display = 'block';
        cartItems.forEach(item => {
            const itemTotal = item.quantity * item.pricePerPlate;
            grandTotal += itemTotal;
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <strong>${item.name}</strong> (${item.filling})<br>
                    <small>Rs. ${itemTotal}</small>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" data-id="${item.id}" data-change="-1">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-id="${item.id}" data-change="1">+</button>
                    <button class="remove-item-btn" data-id="${item.id}">✖</button>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }
    document.getElementById('cart-grand-total').textContent = `Rs. ${grandTotal}`;
}

// --- Profile Modal Logic ---
function populateProfileModal(profile) {
    const form = document.getElementById('profile-form');
    form.querySelector('#profile-name').value = profile?.name || '';
    form.querySelector('#profile-phone').value = profile?.phone || '';
    form.querySelector('#profile-address').value = profile?.delivery_address || '';
    
    const preview = document.getElementById('profile-pic-preview');
    if (profile?.picture) {
        preview.src = URL.createObjectURL(profile.picture);
    } else {
        preview.src = 'https://via.placeholder.com/150';
    }
}

// --- Auth Modal & Form Helpers ---
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');

    displayFormError(loginForm, null); // Clear errors on tab switch
    displayFormError(signupForm, null);

    if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
}

function setButtonLoadingState(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        button.innerHTML = '<div class="spinner"></div>';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        // Restore original button text (assumes it's wrapped in a span)
        const originalText = button.dataset.originalText || 'Submit';
        button.innerHTML = `<span>${originalText}</span>`;
    }
}

function displayFormError(formElement, message) {
    const errorElement = formElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message || '';
        errorElement.style.display = message ? 'block' : 'none';
    }
}

// --- Scroll Reveal ---
function revealOnScroll() {
    const reveals = document.querySelectorAll(".reveal");
    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const revealtop = reveals[i].getBoundingClientRect().top;
        const revealPoint = 100;

        if (revealtop < windowHeight - revealPoint) {
            reveals[i].classList.add("active");
        }
    }
}