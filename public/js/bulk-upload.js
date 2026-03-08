/* eslint-disable no-unused-vars */
/**
 * Client-side validation for bulk upload form.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[action="/admin/bulk-upload"]');
  if (!form) return;

  const fileInput = form.querySelector('input[type="file"]');
  if (!fileInput) return;

  form.addEventListener('submit', (e) => {
    const file = fileInput.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv' && ext !== 'json') {
      e.preventDefault();
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger';
      alert.textContent = 'Please upload a CSV or JSON file.';
      form.parentNode.insertBefore(alert, form);
    }
  });
});
