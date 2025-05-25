document.addEventListener("DOMContentLoaded", () => {
  const accountBtn = document.getElementById("accountBtn");
  const dropdown = document.getElementById("dropdownMenu");

  // Toggle dropdown visibility
  accountBtn.addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  });

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!accountBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  // Auto-refresh posts every 10 seconds
  setInterval(() => {
    fetch(window.location.href)
      .then(res => res.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newContent = doc.querySelector('.blog-list').innerHTML;
        document.querySelector('.blog-list').innerHTML = newContent;
      });
  }, 10000);
});
