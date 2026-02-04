// Small module to enhance comment shortcuts/templates

document.addEventListener('DOMContentLoaded', () => {
  const tmplButtons = document.querySelectorAll('.tmpl-item');
  tmplButtons.forEach(b => b.addEventListener('click', () => {
    const text = b.dataset.text || '';
    const input = document.getElementById('commentInput');
    if(!input) return;
    input.value = text;
    document.getElementById('templateDropdown').classList.add('hidden');
    input.focus();
  }));

  // Close dropdown when clicking elsewhere
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('templateDropdown');
    const btn = document.getElementById('shortcutBtn');
    if(!dd || !btn) return;
    if(!dd.contains(e.target) && !btn.contains(e.target)) dd.classList.add('hidden');
  });
});
