// Applique le thème mémorisé et l'intro avant l'affichage (évite le flash)
try { var t = localStorage.getItem('dak-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
try { if (sessionStorage.getItem('dak-intro')) document.documentElement.classList.add('no-intro'); else sessionStorage.setItem('dak-intro', '1'); } catch (e) {}
