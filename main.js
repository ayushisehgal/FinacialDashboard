// Chart configuration
const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#ffffff' }
    }
  },
  scales: {
    x: {
      ticks: { color: '#ffffff' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' }
    },
    y: {
      ticks: {
        color: '#ffffff',
        callback: value => value.toLocaleString()
      },
      grid: { color: 'rgba(255, 255, 255, 0.1)' }
    }
  }
};

// Initialize charts
const revenueChart = new Chart('revenueChart', {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Revenue',
      data: [],
      fill: true,
      backgroundColor: 'rgb(13,110,253,0.2)',
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  },
  options: {
    ...chartConfig,
    scales: {
      ...chartConfig.scales,
      y: { ...chartConfig.scales.y, beginAtZero: true }
    }
  }
});

const expenditureChart = new Chart('expenditureChart', {
  type: 'pie',
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)',
        'rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'
      ]
    }]
  },
  options: {
    ...chartConfig,
    plugins: {
      ...chartConfig.plugins,
      legend: {
        position: 'right',
        labels: { color: '#ffffff' }
      }
    }
  }
});

// Utility functions
async function fetchData(endpoint) {
  try {
    const response = await fetch(`http://localhost:3000/api/${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

function showAlert(message, type = 'success') {
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alert.style.zIndex = '9999';
  alert.innerHTML = `
    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 3000);
}

const STATUS_CLASSES = {
  'In Stock': 'bg-success',
  'Low Stock': 'bg-warning',
  'Out of Stock': 'bg-danger',
  'pending': 'bg-warning',
  'overdue': 'bg-danger',
  'Pending': 'bg-warning',
  'Overdue': 'bg-danger'
};

// Data update functions
async function updateRevenueChart() {
  const revenues = await fetchData('revenues');
  if (!revenues) return;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  revenues.sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));

  revenueChart.data.labels = revenues.map(r => r.month.substring(0, 3));
  revenueChart.data.datasets[0].data = revenues.map(r => r.amount);
  revenueChart.update();

  // Update KPIs
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const bestRevenue = Math.max(...revenues.map(r => r.amount));
  
  document.querySelector('.bg-primary .card-body h2').textContent = `Rs${totalRevenue.toLocaleString()}`;
  document.querySelector('.bg-warning .card-body h2').textContent = `Rs${bestRevenue.toLocaleString()}`;
}

async function updateSupplyData() {
  const supplies = await fetchData('supplies');
  if (!supplies) return;

  // Update supply table
  const tableBody = document.getElementById('supply-table-body');
  tableBody.innerHTML = supplies.map(supply => `
    <tr>
      <td>${supply.name || 'N/A'}</td>
      <td>${supply.quantity || 0}</td>
      <td>Rs${(supply.value || 0).toLocaleString()}</td>
      <td><span class="badge ${STATUS_CLASSES[supply.status] || 'bg-secondary'}">${supply.status || 'Unknown'}</span></td>
    </tr>
  `).join('');

  // Update expenditure chart
  const paymentsByCategory = supplies.reduce((acc, supply) => {
    acc[supply.name] = (acc[supply.name] || 0) + (supply.value || 0);
    return acc;
  }, {});

  expenditureChart.data.labels = Object.keys(paymentsByCategory);
  expenditureChart.data.datasets[0].data = Object.values(paymentsByCategory);
  expenditureChart.update();

  // Update total supply KPI
  const totalSupply = supplies.reduce((sum, supply) => sum + supply.value, 0);
  document.getElementById('total-supply-value').textContent = `Rs${totalSupply.toLocaleString()}`;
}

async function updatePaymentsData() {
  const payments = await fetchData('payments');
  if (!payments) return;

  const pendingPayments = payments.filter(p => ['pending', 'overdue'].includes(p.status.toLowerCase()));
  const tableBody = document.getElementById('pending-payments-table-body');
  
  if (pendingPayments.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No pending payments</td></tr>';
    return;
  }

  tableBody.innerHTML = pendingPayments.map(payment => `
    <tr>
      <td>${payment.name}</td>
      <td>Rs${payment.amount.toLocaleString()}</td>
      <td>${new Date(payment.dueDate).toLocaleDateString()}</td>
      <td><span class="badge ${STATUS_CLASSES[payment.status.toLowerCase()]}">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span></td>
    </tr>
  `).join('');

  // Update pending payments KPI
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  document.getElementById('pending-payments-total').textContent = `Rs${totalPending.toLocaleString()}`;
}

// Form submission handlers
async function handlePaymentSubmission(event) {
  const form = document.getElementById('paymentForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitBtn = event.target;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('clientName').value,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        dueDate: document.getElementById('dueDate').value,
        status: document.getElementById('status').value.toLowerCase()
      })
    });

    if (!response.ok) throw new Error('Failed to add payment');

    bootstrap.Modal.getInstance(document.getElementById('addPaymentModal')).hide();
    form.reset();
    await Promise.all([updatePaymentsData()]);
    showAlert('Payment added successfully!');
  } catch (error) {
    console.error('Error adding payment:', error);
    showAlert('Failed to add payment. Please try again.', 'danger');
  } finally {
    submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Add Payment';
    submitBtn.disabled = false;
  }
}

async function handleSupplySubmission(event) {
  const form = document.getElementById('supplyForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const quantity = parseInt(document.getElementById('quantity').value);
  const status = quantity > 10 ? 'In Stock' : quantity > 0 ? 'Low Stock' : 'Out of Stock';

  const submitBtn = event.target;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('http://localhost:3000/api/supplies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('itemName').value.trim(),
        quantity: quantity,
        value: parseFloat(document.getElementById('value').value),
        status: status
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to add supply');
    }

    bootstrap.Modal.getInstance(document.getElementById('addSupplyModal')).hide();
    form.reset();
    await Promise.all([updateSupplyData()]);
    showAlert('Supply added successfully!');
  } catch (error) {
    console.error('Error adding supply:', error);
    showAlert('Failed to add supply. Please try again.', 'danger');
  } finally {
    submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Add Supply';
    submitBtn.disabled = false;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    updateRevenueChart(),
    updateSupplyData(),
    updatePaymentsData()
  ]);

  document.getElementById('submitPayment')?.addEventListener('click', handlePaymentSubmission);
  document.getElementById('submitSupply')?.addEventListener('click', handleSupplySubmission);

    // Add this new event listener for logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '../index.html';
    });
});

// Handle window resize
window.addEventListener('resize', () => {
  revenueChart.resize();
  expenditureChart.resize();
});

// Periodic refresh (every 5 minutes)
setInterval(() => {
  Promise.all([
    updateRevenueChart(),
    updateSupplyData(),
    updatePaymentsData()
  ]);
}, 300000);

