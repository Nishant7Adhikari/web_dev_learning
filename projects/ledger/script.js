document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Central State & Config ---
    let state = {
        activeProfileId: null,
        sortPreference: 'createdAt-desc',
        viewMode: 'grid',
        searchTerm: '',
        activeTags: new Set(),
        allTags: new Set()
    };
    const ICONS = ['fa-gift', 'fa-user', 'fa-heart', 'fa-star', 'fa-home', 'fa-car', 'fa-plane', 'fa-briefcase'];

    // --- 2. DOM Elements Cache ---
    const DOMElements = {
        themeToggle: document.getElementById('theme-toggle'),
        totalPriceDisplay: document.getElementById('total-price-display'),
        settingsBtn: document.getElementById('settings-btn'),
        profileNameHeader: document.getElementById('profile-name-header'),
        searchInput: document.getElementById('search-input'),
        sortSelect: document.getElementById('sort-select'),
        viewToggleBtn: document.getElementById('view-toggle-btn'),
        tagFilterContainer: document.getElementById('tag-filter-container'),
        wishlistContainer: document.getElementById('wishlist-container'),
        emptyStateMessage: document.getElementById('empty-state-message'),
        completedBtn: document.getElementById('completed-btn'),
        addWishBtn: document.getElementById('add-wish-btn'),
        profileBtn: document.getElementById('profile-btn'),
        addEditModal: document.getElementById('add-edit-modal'),
        modalTitle: document.getElementById('modal-title'),
        addEditForm: document.getElementById('add-edit-form'),
        editItemIdInput: document.getElementById('edit-item-id'),
        productNameInput: document.getElementById('productName'),
        imageUploadInput: document.getElementById('imageUpload'),
        imagePreview: document.getElementById('image-preview'),
        goalDateInput: document.getElementById('goalDate'),
        tagsInput: document.getElementById('tags'),
        notesInput: document.getElementById('notes'),
        pricesContainer: document.getElementById('prices-container'),
        addPriceBtn: document.getElementById('add-price-btn'),
        linksContainer: document.getElementById('links-container'),
        addLinkBtn: document.getElementById('add-link-btn'),
        completedModal: document.getElementById('completed-modal'),
        completedListContainer: document.getElementById('completed-list-container'),
        settingsModal: document.getElementById('settings-modal'),
        analyticsBtn: document.getElementById('analytics-btn'),
        analyticsModal: document.getElementById('analytics-modal'),
        analyticsGrid: document.getElementById('analytics-grid'),
        profileModal: document.getElementById('profile-modal'),
        profileList: document.getElementById('profile-list'),
        addProfileForm: document.getElementById('add-profile-form'),
        newProfileNameInput: document.getElementById('new-profile-name'),
        linkChoiceModal: document.getElementById('link-choice-modal'),
        linkChoiceList: document.getElementById('link-choice-list'),
        notesModal: document.getElementById('notes-modal'),
        notesContent: document.getElementById('notes-content'),
        toast: document.getElementById('toast'),
    };
    
    // --- 3. Database Layer ---
    const dbLayer = {
        db: null,
        init: function() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('WishlistProDB', 5);
                request.onupgradeneeded = e => {
                    this.db = e.target.result;
                    if (!this.db.objectStoreNames.contains('wishes')) {
                        const wishStore = this.db.createObjectStore('wishes', { keyPath: 'id' });
                        wishStore.createIndex('profileId', 'profileId', { unique: false });
                    }
                    if (!this.db.objectStoreNames.contains('profiles')) this.db.createObjectStore('profiles', { keyPath: 'id' });
                };
                request.onsuccess = e => { this.db = e.target.result; resolve(); };
                request.onerror = e => { console.error('DB Error:', e.target.error); reject(e.target.error);};
            });
        },
        getWish: id => new Promise(r => dbLayer.db.transaction('wishes').objectStore('wishes').get(id).onsuccess = e => r(e.target.result)),
        getWishes: profileId => new Promise(r => dbLayer.db.transaction('wishes').objectStore('wishes').index('profileId').getAll(profileId).onsuccess = e => r(e.target.result)),
        putWish: wish => new Promise(r => { let t = dbLayer.db.transaction('wishes', 'readwrite'); t.objectStore('wishes').put(wish); t.oncomplete = () => r(); }),
        deleteWish: id => new Promise(r => { let t = dbLayer.db.transaction('wishes', 'readwrite'); t.objectStore('wishes').delete(id); t.oncomplete = () => r(); }),
        getProfile: id => new Promise(r => dbLayer.db.transaction('profiles').objectStore('profiles').get(id).onsuccess = e => r(e.target.result)),
        getProfiles: () => new Promise(r => dbLayer.db.transaction('profiles').objectStore('profiles').getAll().onsuccess = e => r(e.target.result)),
        putProfile: profile => new Promise(r => { let t = dbLayer.db.transaction('profiles', 'readwrite'); t.objectStore('profiles').put(profile); t.oncomplete = () => r(); }),
    };

    // --- 4. UI Layer ---
    const UILayer = {
        renderAll: async function() {
            if (!state.activeProfileId) return;
            const allWishes = await dbLayer.getWishes(state.activeProfileId);
            const activeWishes = allWishes.filter(w => !w.completed);
            
            this.updateAllTags(allWishes);
            this.renderTagFilters();
            this.renderWishlist(activeWishes);
            this.updateTotalDisplay(activeWishes);
        },
        renderWishlist: function(wishes) {
            let processedWishes = this.filterWishes(wishes);
            processedWishes = this.sortWishes(processedWishes);
            
            DOMElements.wishlistContainer.innerHTML = '';
            if (processedWishes.length === 0 && state.searchTerm === '' && state.activeTags.size === 0) {
                 DOMElements.emptyStateMessage.innerHTML = `<h3>This Wishlist is Empty</h3><p>Click the '+' button to add your first item!</p>`;
                 DOMElements.emptyStateMessage.style.display = 'block';
            } else if (processedWishes.length === 0) {
                DOMElements.emptyStateMessage.innerHTML = `<h3>No Wishes Found</h3><p>Try clearing your search or filters.</p>`;
                DOMElements.emptyStateMessage.style.display = 'block';
            } else {
                DOMElements.emptyStateMessage.style.display = 'none';
                processedWishes.forEach(item => DOMElements.wishlistContainer.innerHTML += this.createWishCardHTML(item));
            }
        },
        filterWishes: (wishes) => wishes.filter(w => {
            const searchMatch = state.searchTerm ? w.name.toLowerCase().includes(state.searchTerm) : true;
            const tagMatch = state.activeTags.size > 0 ? w.tags && w.tags.some(t => state.activeTags.has(t)) : true;
            return searchMatch && tagMatch;
        }),
        sortWishes: (wishes) => {
            const sorted = [...wishes];
            return sorted.sort((a, b) => {
                const [key, dir] = state.sortPreference.split('-');
                let valA = a[key] || (key === 'goalDate' ? '9999-12-31' : 0);
                let valB = b[key] || (key === 'goalDate' ? '9999-12-31' : 0);
                
                if (key === 'price') {
                    valA = AppLogic.calculateItemPrice(a);
                    valB = AppLogic.calculateItemPrice(b);
                }
                if (key === 'name') {
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                }

                if (dir === 'asc') return valA > valB ? 1 : (valA < valB ? -1 : 0);
                return valA < valB ? 1 : (valA > valB ? -1 : 0);
            });
        },
        createWishCardHTML: (item, isCompletedView = false) => {
            const imageSrc = item.imageBlob ? URL.createObjectURL(item.imageBlob) : 'https://via.placeholder.com/300x180.png?text=No+Image';
            const price = AppLogic.calculateItemPrice(item);
            const priceHTML = `<strong>Rs ${price.toLocaleString('en-IN')}</strong>`;
            const goalDateHTML = item.goalDate ? `<span><i class="fa-solid fa-calendar-check"></i> ${new Date(item.goalDate).toLocaleDateString()}</span>` : '';
            const tagsHTML = item.tags && item.tags.length ? `<div class="tag-list">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : '';
            const notesIcon = item.notes ? `<button class="icon-btn card-action-btn" data-action="notes"><i class="fa-solid fa-note-sticky"></i></button>` : '';
            
            let linksBtnHTML = '';
            if (item.links && item.links.length > 0) {
                linksBtnHTML = `<button class="btn btn-secondary" data-action="links" style="padding: 0.5rem 1rem;"><i class="fa-solid fa-store"></i> ${item.links.length > 1 ? `Links (${item.links.length})` : 'Store Link'}</button>`;
            }

            let mainActions = isCompletedView
                ? `<button class="icon-btn card-action-btn" data-action="uncomplete" title="Move to Wishlist"><i class="fa-solid fa-rotate-left"></i></button>`
                : `<button class="icon-btn card-action-btn" data-action="share" title="Share"><i class="fa-solid fa-share-alt"></i></button><button class="icon-btn card-action-btn" data-action="complete" title="Mark Complete"><i class="fa-solid fa-check"></i></button>`;
            
            const editDeleteBtns = `<button class="icon-btn card-action-btn" data-action="edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button><button class="icon-btn card-action-btn" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>`;

            return `
            <div class="wish-card" data-id="${item.id}">
                <img src="${imageSrc}" class="wish-card-img" alt="${item.name}">
                <div class="wish-card-content">
                    <div class="wish-card-header">
                        <h3 class="wish-card-name">${item.name}</h3>
                        ${notesIcon}
                    </div>
                    <div class="wish-card-meta">${priceHTML} ${goalDateHTML}</div>
                    ${tagsHTML}
                    <div class="wish-card-footer">
                        ${linksBtnHTML}
                        <div class="card-actions">${editDeleteBtns}${mainActions}</div>
                    </div>
                </div>
            </div>`;
        },
        updateAllTags: (wishes) => {
            state.allTags.clear();
            wishes.forEach(w => w.tags && w.tags.forEach(t => state.allTags.add(t)));
        },
        renderTagFilters: () => {
            DOMElements.tagFilterContainer.style.display = state.allTags.size > 0 ? 'flex' : 'none';
            DOMElements.tagFilterContainer.innerHTML = Array.from(state.allTags).sort().map(tag =>
                `<span class="filter-tag ${state.activeTags.has(tag) ? 'active' : ''}" data-tag="${tag}">${tag}</span>`
            ).join('');
        },
        renderProfiles: async () => {
            const profiles = await dbLayer.getProfiles();
            DOMElements.profileList.innerHTML = profiles.map(p => `
                <div class="profile-card ${p.id === state.activeProfileId ? 'active' : ''}" data-id="${p.id}">
                    <i class="fa-solid ${p.icon}"></i>
                    <div>${p.name}</div>
                </div>
            `).join('');
        },
        renderCompletedList: async () => {
            const allWishes = await dbLayer.getWishes(state.activeProfileId);
            const completedWishes = allWishes.filter(w => w.completed);
            DOMElements.completedListContainer.innerHTML = '';
            if (completedWishes.length === 0) {
                DOMElements.completedListContainer.innerHTML = `<p class="empty-state">No completed wishes yet.</p>`;
            } else {
                completedWishes.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                completedWishes.forEach(item => DOMElements.completedListContainer.innerHTML += UILayer.createWishCardHTML(item, true));
            }
        },
        renderAnalytics: async () => {
            const allWishes = await dbLayer.getWishes(state.activeProfileId);
            const completedWishes = allWishes.filter(w => w.completed);
            const activeWishes = allWishes.filter(w => !w.completed);

            const totalValue = activeWishes.reduce((sum, item) => sum + AppLogic.calculateItemPrice(item), 0);
            const totalSpent = completedWishes.reduce((sum, item) => sum + AppLogic.calculateItemPrice(item), 0);
            const mostExpensiveItem = activeWishes.length > 0 ? activeWishes.reduce((max, item) => AppLogic.calculateItemPrice(item) > AppLogic.calculateItemPrice(max) ? item : max, activeWishes[0]) : {name: 'N/A'};
            const mostExpensivePrice = mostExpensiveItem.name !== 'N/A' ? AppLogic.calculateItemPrice(mostExpensiveItem) : 0;
            const mostCommonTag = Array.from(state.allTags).map(tag => ({ tag, count: allWishes.filter(w => w.tags && w.tags.includes(tag)).length })).sort((a,b) => b.count - a.count)[0] || {tag: 'N/A'};

            const stats = {
                'Active Wishes': activeWishes.length, 'Completed Wishes': completedWishes.length, 'Total Wishlist Value': `Rs ${totalValue.toLocaleString('en-IN')}`, 'Total Spent': `Rs ${totalSpent.toLocaleString('en-IN')}`,
                'Most Expensive Wish': `${mostExpensiveItem.name} (Rs ${mostExpensivePrice.toLocaleString('en-IN')})`, 'Favorite Category': mostCommonTag.tag
            };

            DOMElements.analyticsGrid.innerHTML = Object.entries(stats).map(([label, value]) => `
                <div class="stat-card">
                    <div class="value">${value}</div>
                    <div class="label">${label}</div>
                </div>
            `).join('');
        },
        updateTotalDisplay: (wishes) => {
            const total = wishes.reduce((sum, item) => sum + AppLogic.calculateItemPrice(item), 0);
            DOMElements.totalPriceDisplay.textContent = `Rs ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        },
        showToast: (message) => {
            DOMElements.toast.textContent = message;
            DOMElements.toast.classList.add('show');
            setTimeout(() => DOMElements.toast.classList.remove('show'), 3000);
        }
    };
    
    // --- 5. Application Logic ---
    const AppLogic = {
        init: async function() {
            this.loadState();
            await dbLayer.init();
            await this.setupInitialProfile();
            this.setupEventListeners();
            await UILayer.renderAll();
            this.registerServiceWorker();
        },
        loadState: () => {
            state.activeProfileId = localStorage.getItem('wishlist-activeProfile');
            state.sortPreference = localStorage.getItem('wishlist-sort') || 'createdAt-desc';
            state.viewMode = localStorage.getItem('wishlist-view') || 'grid';
            const theme = localStorage.getItem('wishlist-theme');
            if(theme) document.documentElement.setAttribute('data-theme', theme);
            DOMElements.sortSelect.value = state.sortPreference;
            DOMElements.wishlistContainer.className = state.viewMode === 'list' ? 'list-view' : '';
            DOMElements.viewToggleBtn.innerHTML = state.viewMode === 'list' ? '<i class="fa-solid fa-grip"></i>' : '<i class="fa-solid fa-list"></i>';
        },
        saveState: () => localStorage.setItem('wishlist-activeProfile', state.activeProfileId),
        setupInitialProfile: async () => {
            let profiles = await dbLayer.getProfiles();
            if (profiles.length === 0) {
                const defaultProfile = { id: self.crypto.randomUUID(), name: 'My Wishlist', icon: 'fa-gift' };
                await dbLayer.putProfile(defaultProfile);
                state.activeProfileId = defaultProfile.id;
                AppLogic.saveState();
                profiles.push(defaultProfile);
            }
            if (!state.activeProfileId || !profiles.some(p => p.id === state.activeProfileId)) {
                state.activeProfileId = profiles[0].id;
                AppLogic.saveState();
            }
            const activeProfile = profiles.find(p => p.id === state.activeProfileId);
            DOMElements.profileNameHeader.textContent = activeProfile.name;
        },
        setupEventListeners: function() {
            DOMElements.themeToggle.addEventListener('click', () => {
                const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('wishlist-theme', newTheme);
            });
            DOMElements.addWishBtn.addEventListener('click', () => this.openAddEditModal());
            DOMElements.profileBtn.addEventListener('click', async () => { await UILayer.renderProfiles(); DOMElements.profileModal.showModal(); });
            DOMElements.settingsBtn.addEventListener('click', () => DOMElements.settingsModal.showModal());
            DOMElements.completedBtn.addEventListener('click', async () => { await UILayer.renderCompletedList(); DOMElements.completedModal.showModal(); });
            DOMElements.analyticsBtn.addEventListener('click', async () => { await UILayer.renderAnalytics(); DOMElements.analyticsModal.showModal(); });
            
            DOMElements.addEditForm.addEventListener('submit', e => this.handleFormSubmit(e));
            DOMElements.addProfileForm.addEventListener('submit', e => this.handleAddProfile(e));
            
            DOMElements.searchInput.addEventListener('input', e => this.handleSearch(e));
            DOMElements.sortSelect.addEventListener('change', e => this.handleSort(e));
            DOMElements.viewToggleBtn.addEventListener('click', () => this.handleViewToggle());
            DOMElements.tagFilterContainer.addEventListener('click', e => this.handleTagClick(e));
            
            document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => btn.closest('dialog').close()));
            
            DOMElements.wishlistContainer.addEventListener('click', e => this.handleWishlistActions(e, false));
            DOMElements.completedListContainer.addEventListener('click', e => this.handleWishlistActions(e, true));
            DOMElements.profileList.addEventListener('click', e => this.handleProfileSwitch(e));

            DOMElements.addPriceBtn.addEventListener('click', () => this.addDynamicEntry('price'));
            DOMElements.addLinkBtn.addEventListener('click', () => this.addDynamicEntry('link'));
        },
        calculateItemPrice: (item) => {
            const marked = item.prices.find(p => p.isMarked);
            if (marked) return marked.price;
            if (item.prices.length > 0) return item.prices.reduce((s, p) => s + p.price, 0) / item.prices.length;
            return 0;
        },
        compressImage: (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    const maxWidth = 1024;
                    if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    ctx.canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        }),
        handleShare: async (itemId) => {
            const item = await dbLayer.getWish(itemId);
            if (!item) return;
            let shareText = `🌟 Wishlist Item: ${item.name}\n\n`;
            if (item.notes) shareText += `📝 Notes: ${item.notes}\n`;
            if (item.prices.length > 0) {
                shareText += "💰 Prices:\n";
                item.prices.forEach(p => { shareText += `- ${p.store || 'Estimate'}: Rs ${p.price}\n`; });
            }
            if (item.links.length > 0) {
                shareText += "\n🔗 Links:\n";
                item.links.forEach(l => { shareText += `- ${l.name}: ${l.url}\n`; });
            }
            navigator.clipboard.writeText(shareText).then(() => UILayer.showToast('Wish details copied!'))
                .catch(err => console.error('Failed to copy: ', err));
        },
        registerServiceWorker: () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => console.log('Service Worker registered.', reg))
                    .catch(err => console.error('Service Worker registration failed:', err));
            }
        },
        openAddEditModal: async function(itemId = null) {
            DOMElements.addEditForm.reset();
            DOMElements.pricesContainer.innerHTML = '';
            DOMElements.linksContainer.innerHTML = '';
            DOMElements.imagePreview.style.display = 'none';
            DOMElements.imagePreview.src = '';
            DOMElements.imageUploadInput.value = '';

            if(itemId) {
                DOMElements.modalTitle.textContent = "Edit Wish";
                const item = await dbLayer.getWish(itemId);
                DOMElements.editItemIdInput.value = item.id;
                DOMElements.productNameInput.value = item.name;
                DOMElements.goalDateInput.value = item.goalDate || '';
                DOMElements.tagsInput.value = item.tags ? item.tags.join(', ') : '';
                DOMElements.notesInput.value = item.notes || '';
                if(item.imageBlob) {
                    DOMElements.imagePreview.src = URL.createObjectURL(item.imageBlob);
                    DOMElements.imagePreview.style.display = 'block';
                }
                if (item.prices) item.prices.forEach(p => AppLogic.addDynamicEntry('price', p));
                if (item.links) item.links.forEach(l => AppLogic.addDynamicEntry('link', l));
            } else {
                DOMElements.modalTitle.textContent = "Add Wish";
                DOMElements.editItemIdInput.value = '';
                this.addDynamicEntry('price');
            }
            DOMElements.addEditModal.showModal();
        },
        addDynamicEntry: (type, data = {}) => {
            const container = type === 'price' ? DOMElements.pricesContainer : DOMElements.linksContainer;
            const entry = document.createElement('div');
            entry.className = 'dynamic-entry';
            if(type === 'price') {
                entry.innerHTML = `<input type="text" class="form-control store-input" placeholder="Store" value="${data.store || ''}"><input type="number" class="form-control price-input" placeholder="Price" value="${data.price || ''}" required><input type="radio" name="marked-price" class="mark-price-radio" ${data.isMarked ? 'checked' : ''}><button type="button" class="icon-btn"><i class="fa-solid fa-trash"></i></button>`;
            } else {
                entry.innerHTML = `<input type="text" class="form-control link-name-input" placeholder="Link Name" value="${data.name || ''}" required><input type="url" class="form-control link-url-input" placeholder="https://..." value="${data.url || ''}" required><button type="button" class="icon-btn"><i class="fa-solid fa-trash"></i></button>`;
            }
            entry.querySelector('button').addEventListener('click', () => entry.remove());
            container.appendChild(entry);
        },
        handleFormSubmit: async function(e) {
            e.preventDefault();
            const id = DOMElements.editItemIdInput.value;
            let imageBlob = null;
            if(DOMElements.imageUploadInput.files[0]) {
                imageBlob = await this.compressImage(DOMElements.imageUploadInput.files[0]);
            } else if (id) {
                const existing = await dbLayer.getWish(id);
                imageBlob = existing.imageBlob;
            }

            const prices = Array.from(DOMElements.pricesContainer.querySelectorAll('.dynamic-entry')).map(entry => ({
                store: entry.querySelector('.store-input').value, price: parseFloat(entry.querySelector('.price-input').value), isMarked: entry.querySelector('.mark-price-radio').checked,
            })).filter(p => !isNaN(p.price));

            const links = Array.from(DOMElements.linksContainer.querySelectorAll('.dynamic-entry')).map(entry => ({
                name: entry.querySelector('.link-name-input').value, url: entry.querySelector('.link-url-input').value
            })).filter(l => l.name && l.url);
            
            const tags = DOMElements.tagsInput.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            const now = new Date().toISOString();
            
            const wishData = {
                name: DOMElements.productNameInput.value, profileId: state.activeProfileId, completed: false, imageBlob, goalDate: DOMElements.goalDateInput.value, tags, notes: DOMElements.notesInput.value, prices, links, updatedAt: now
            };

            if(id) {
                const existing = await dbLayer.getWish(id);
                await dbLayer.putWish({...existing, ...wishData, completed: existing.completed }); // preserve completed status
            } else {
                await dbLayer.putWish({ id: self.crypto.randomUUID(), ...wishData, createdAt: now });
            }
            DOMElements.addEditModal.close();
            UILayer.renderAll();
            UILayer.showToast(id ? 'Wish updated!' : 'Wish added!');
        },
        handleAddProfile: async function(e) {
            e.preventDefault();
            const name = DOMElements.newProfileNameInput.value.trim();
            if(!name) return;
            const newProfile = { id: self.crypto.randomUUID(), name, icon: ICONS[Math.floor(Math.random() * ICONS.length)] };
            await dbLayer.putProfile(newProfile);
            await UILayer.renderProfiles();
            DOMElements.newProfileNameInput.value = '';
        },
        handleWishlistActions: async function(e, isCompletedView = false) {
            const button = e.target.closest('.card-action-btn, .btn');
            if(!button) return;
            const card = e.target.closest('.wish-card');
            const id = card.dataset.id;
            const action = button.dataset.action;
            
            const item = await dbLayer.getWish(id);

            switch (action) {
                case 'edit': this.openAddEditModal(id); break;
                case 'delete': 
                    if(confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) {
                        await dbLayer.deleteWish(id);
                        isCompletedView ? await UILayer.renderCompletedList() : await UILayer.renderAll();
                        UILayer.showToast('Wish deleted.');
                    }
                    break;
                case 'complete': item.completed = true; item.updatedAt = new Date().toISOString(); await dbLayer.putWish(item); await UILayer.renderAll(); break;
                case 'uncomplete': item.completed = false; item.updatedAt = new Date().toISOString(); await dbLayer.putWish(item); await UILayer.renderCompletedList(); await UILayer.renderAll(); break;
                case 'share': this.handleShare(id); break;
                case 'notes': DOMElements.notesContent.textContent = item.notes; DOMElements.notesModal.showModal(); break;
                case 'links':
                    if (item.links.length === 1) { window.open(item.links[0].url, '_blank'); } 
                    else {
                        DOMElements.linkChoiceList.innerHTML = item.links.map(l => `<li><a href="${l.url}" target="_blank">${l.name}</a></li>`).join('');
                        DOMElements.linkChoiceModal.showModal();
                    }
                    break;
            }
        },
        handleProfileSwitch: async function(e) {
            const card = e.target.closest('.profile-card');
            if(!card) return;
            state.activeProfileId = card.dataset.id;
            this.saveState();
            const profile = await dbLayer.getProfile(state.activeProfileId);
            DOMElements.profileNameHeader.textContent = profile.name;
            await UILayer.renderAll();
            await UILayer.renderProfiles(); // Re-render to show active state
            DOMElements.profileModal.close();
        },
        handleSearch: e => { state.searchTerm = e.target.value.toLowerCase(); UILayer.renderAll(); },
        handleSort: e => { state.sortPreference = e.target.value; localStorage.setItem('wishlist-sort', e.target.value); UILayer.renderAll(); },
        handleViewToggle: () => {
            state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
            localStorage.setItem('wishlist-view', state.viewMode);
            DOMElements.wishlistContainer.classList.toggle('list-view');
            DOMElements.viewToggleBtn.innerHTML = state.viewMode === 'list' ? '<i class="fa-solid fa-grip"></i>' : '<i class="fa-solid fa-list"></i>';
        },
        handleTagClick: e => {
            if(e.target.classList.contains('filter-tag')) {
                const tag = e.target.dataset.tag;
                if(state.activeTags.has(tag)) {
                    state.activeTags.delete(tag);
                } else {
                    state.activeTags.add(tag);
                }
                UILayer.renderAll();
            }
        }
    };
    
    // --- Start the App ---
    AppLogic.init().catch(err => {
        console.error("Failed to initialize the application:", err);
        alert("A critical error occurred. Please refresh the page.");
    });
});