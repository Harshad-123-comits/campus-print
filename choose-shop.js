import { listShops } from "./shops.js";

document.addEventListener('DOMContentLoaded', async () => {
  const shopGrid = document.getElementById('shopGrid');

  if (!shopGrid) {
    return;
  }

  shopGrid.innerHTML = `
    <article class="glass-panel shop-card shop-card-empty">
      <div class="spinner" style="border-top-color: var(--primary);"></div>
      <p>Loading shops...</p>
    </article>
  `;

  const shops = await listShops();

  if (!shops.length) {
    shopGrid.innerHTML = `
      <article class="glass-panel shop-card shop-card-empty">
        <h3>No shops available yet</h3>
        <p>Add a shop in Supabase and it will appear here automatically.</p>
      </article>
    `;
    return;
  }

  shopGrid.innerHTML = shops.map((shop, index) => `
    <article class="glass-panel shop-card animate-slide-up delay-${Math.min(index + 1, 4)}">
      <div class="shop-card-top">
        <span class="shop-accent shop-accent-${shop.accent || "blue"}"></span>
        <span class="shop-location">${shop.location || "Campus Print"}</span>
      </div>
      <h3>${shop.name}</h3>
      <p>${shop.description || "Reliable campus printing and easy pickup."}</p>
      <div class="shop-card-footer">
        <span class="shopkeeper-chip">${shop.shopkeeperEmail}</span>
        <a class="btn btn-primary" href="user.html?shop=${encodeURIComponent(shop.slug)}">Choose This Shop</a>
      </div>
    </article>
  `).join('');
});
