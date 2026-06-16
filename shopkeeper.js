import { isSupabaseConfigured, requireSupabase } from "./supabase.js";
import { getManagedShopsByEmail } from "./shops.js";

document.addEventListener('DOMContentLoaded', async () => {
  const logoutBtn = document.getElementById('logoutBtn');
  const tableBody = document.getElementById('jobsTableBody');
  const authStatus = document.getElementById('authStatus');
  const managedShops = document.getElementById('managedShops');
  const dashboardScope = document.getElementById('dashboardScope');
  const statPending = document.getElementById('statPending');
  const statPrinted = document.getElementById('statPrinted');
  const statTotalItems = document.getElementById('statTotalItems');
  let refreshTimer = null;
  let assignedShops = [];

  const setEmptyState = (message) => {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">${message}</td></tr>`;
    statPending.textContent = "0";
    statPrinted.textContent = "0";
    statTotalItems.textContent = "0";
  };

  if (!isSupabaseConfigured) {
    authStatus.textContent = 'Supabase not configured';
    setEmptyState('Add your project URL and anon key in supabase.js first.');
    return;
  }

  const supabase = requireSupabase();

  const renderJobs = (jobs) => {
    let html = '';
    let pendingCount = 0;
    let printedCount = 0;
    let totalCopies = 0;

    if (!jobs.length) {
      setEmptyState('No jobs found.');
      return;
    }

    jobs.forEach((job) => {
      if (job.status === 'Pending') pendingCount++;
      if (job.status === 'Printed') printedCount++;
      totalCopies += parseInt(job.copies || 0, 10);

      const submittedAt = job.submitted_at ? new Date(job.submitted_at) : null;
      const timeString = submittedAt
        ? submittedAt.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Unknown';

      const actionColumn = job.status === 'Pending'
        ? `<button onclick="markAsPrinted('${job.id}')" class="btn btn-primary action-btn">Mark as Printed</button>`
        : `<span style="color: var(--text-muted); font-size: 0.875rem;">&#10003; Completed</span>`;

      const statusBadge = job.status === 'Pending'
        ? `<span class="badge badge-pending">Pending</span>`
        : `<span class="badge badge-printed">Printed</span>`;

      const fileDisplay = job.file_url
        ? `<a href="${job.file_url}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: none;">${job.file_name}</a>`
        : job.file_name;

      html += `
        <tr>
          <td><span class="table-shop-pill">${job.shop_name || 'Unassigned'}</span></td>
          <td>
            <div style="font-weight: 500; word-break: break-all;">${fileDisplay}</div>
          </td>
          <td>${job.copies}</td>
          <td>${job.print_type}</td>
          <td>${job.payment_method}</td>
          <td>${statusBadge}</td>
          <td style="color: var(--text-muted); font-size: 0.875rem;">${timeString}</td>
          <td>${actionColumn}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    statPending.textContent = pendingCount;
    statPrinted.textContent = printedCount;
    statTotalItems.textContent = totalCopies;
  };

  const loadJobs = async () => {
    if (!assignedShops.length) {
      setEmptyState('No shop is assigned to this shopkeeper email yet.');
      return;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('id, file_name, file_url, shop_name, shop_slug, copies, print_type, payment_method, status, submitted_at')
      .in('shop_slug', assignedShops.map((shop) => shop.slug))
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error("Error loading jobs: ", error);
      setEmptyState(error.message || 'Failed to load jobs.');
      return;
    }

    renderJobs(data || []);
  };

  window.markAsPrinted = async (jobId) => {
    if (!assignedShops.length) {
      alert('No shop is assigned to this account.');
      return;
    }

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'Printed' })
      .eq('id', jobId)
      .in('shop_slug', assignedShops.map((shop) => shop.slug));

    if (error) {
      console.error("Error updating job: ", error);
      alert(error.message || 'Failed to update job status.');
      return;
    }

    await loadJobs();
  };

  logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      console.error("Error signing out: ", error);
      alert(error.message || 'Failed to sign out.');
      return;
    }

    window.location.href = 'shop-login.html';
  });

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    window.location.href = 'shop-login.html';
    return;
  }

  assignedShops = await getManagedShopsByEmail(session.user.email);
  if (managedShops) {
    managedShops.innerHTML = assignedShops.length
      ? assignedShops.map((shop) => `<span class="managed-shop-chip">${shop.name}</span>`).join('')
      : '<span class="managed-shop-chip managed-shop-chip-muted">No shop assigned</span>';
  }

  if (dashboardScope) {
    dashboardScope.textContent = assignedShops.length
      ? `Showing orders for ${assignedShops.map((shop) => shop.name).join(', ')}.`
      : 'This account is signed in, but no active shop is assigned to it in the Supabase shops table yet.';
  }

  authStatus.textContent = session.user.email || 'Authenticated';
  await loadJobs();
  refreshTimer = window.setInterval(loadJobs, 5000);

  supabase.auth.onAuthStateChange((event, nextSession) => {
    if (event === 'SIGNED_OUT' || !nextSession) {
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
      }
      window.location.href = 'shop-login.html';
    }
  });
});
