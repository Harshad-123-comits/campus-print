import { isSupabaseConfigured, requireSupabase } from "./supabase.js";
import { getShopBySlug } from "./shops.js";

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('printForm');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileDoc');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  const alertBox = document.getElementById('alertBox');
  const selectedShopBanner = document.getElementById('selectedShopBanner');
  const isServedFromFile = window.location.protocol === 'file:';
  const params = new URLSearchParams(window.location.search);
  let selectedShop = null;

  const setAlert = (message, type) => {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
  };

  const resetSubmitState = () => {
    submitBtn.disabled = false;
    btnText.textContent = 'Upload & Submit Job';
    btnLoader.style.display = 'none';
  };

  const updateSelectedShopBanner = () => {
    if (!selectedShopBanner) {
      return;
    }

    if (selectedShop) {
      selectedShopBanner.className = 'selected-shop-banner';
      selectedShopBanner.innerHTML = `
        <span class="selected-shop-label">Selected shop</span>
        <strong>${selectedShop.name}</strong>
        <span>${selectedShop.location || "Campus Print"}</span>
        <a href="choose-shop.html">Change shop</a>
      `;
      return;
    }

    selectedShopBanner.className = 'selected-shop-banner selected-shop-banner-error';
    selectedShopBanner.innerHTML = `
      <span class="selected-shop-label">Shop required</span>
      <strong>Select a shopkeeper before uploading</strong>
      <a href="choose-shop.html">Choose a shop</a>
    `;
  };

  if (params.get('shop')) {
    selectedShop = await getShopBySlug(params.get('shop'));
  }

  updateSelectedShopBanner();

  if (selectedShopBanner) {
    selectedShopBanner.classList.remove('hidden');
  }

  if (!isSupabaseConfigured) {
    setAlert('Supabase is not configured yet. Add your project URL and anon key in supabase.js.', 'error');
  } else if (isServedFromFile) {
    setAlert('Open this app through a local server like http://localhost, not by double-clicking the HTML file.', 'error');
  } else if (!selectedShop) {
    setAlert('Choose a shopkeeper first so the order reaches the correct queue.', 'error');
    submitBtn.disabled = true;
  }

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      fileNameDisplay.textContent = `Selected: ${fileInput.files[0].name}`;
      fileNameDisplay.style.color = 'var(--success)';
    } else {
      fileNameDisplay.textContent = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const copies = parseInt(document.getElementById('copies').value, 10);
    const printType = document.getElementById('printType').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!file) {
      setAlert('Please select a file to print.', 'error');
      return;
    }

    if (!isSupabaseConfigured) {
      setAlert('Supabase is not configured yet. Add your project URL and anon key in supabase.js.', 'error');
      return;
    }

    if (isServedFromFile) {
      setAlert('This page is running from file://. Start a local server first, then try again.', 'error');
      return;
    }

    if (!selectedShop) {
      setAlert('Choose a shopkeeper first so the order reaches the correct queue.', 'error');
      return;
    }

    submitBtn.disabled = true;
    btnText.textContent = 'Uploading...';
    btnLoader.style.display = 'inline-block';
    alertBox.style.display = 'none';

    try {
      const supabase = requireSupabase();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `uploads/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('print-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('print-files')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_url: publicUrlData.publicUrl,
          shop_slug: selectedShop.slug,
          shop_name: selectedShop.name,
          shopkeeper_email: selectedShop.shopkeeperEmail,
          copies,
          print_type: printType,
          payment_method: paymentMethod,
          status: 'Pending'
        });

      if (insertError) {
        throw insertError;
      }

      setAlert(`Job submitted successfully to ${selectedShop.name}. The selected shopkeeper will handle it shortly.`, 'success');
      form.reset();
      fileNameDisplay.textContent = '';
      resetSubmitState();
    } catch (error) {
      console.error(error);
      setAlert(error.message || 'Failed to submit job.', 'error');
      resetSubmitState();
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 600);
    }
  });
});
