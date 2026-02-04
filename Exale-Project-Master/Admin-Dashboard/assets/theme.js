// Theme helper: persist theme preference and apply

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('exale:theme');
  if(saved === 'light') document.documentElement.classList.remove('dark');
  else document.documentElement.classList.add('dark');

  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.addEventListener('click', toggleTheme);
});

function toggleTheme() {
  const html = document.documentElement;
  if(html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.setItem('exale:theme', 'light');
  } else {
    html.classList.add('dark');
    localStorage.setItem('exale:theme', 'dark');
  }
}

export { toggleTheme };