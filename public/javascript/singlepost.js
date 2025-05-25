document.addEventListener('DOMContentLoaded', () => {
  const likeBtn = document.getElementById('likeBtn');
  const likeCount = document.getElementById('likeCount');
  const postId = window.location.pathname.split('/')[2];

  likeBtn.addEventListener('click', async () => {
    if (likeBtn.classList.contains('fas')) return; // Already liked

    try {
      const res = await fetch(`/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      likeCount.textContent = data.likes;
      likeBtn.classList.remove('far');
      likeBtn.classList.add('fas');
    } catch (err) {
      console.error('Like failed', err);
    }
  });
});
