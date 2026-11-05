var siteHeader = document.querySelector('header');
var siteNav = document.querySelector('.nav-bar');
var navToggle = document.querySelector('.nav-toggle');
var menuIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>';
var closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>';

function setMenuOpen(open) {
    if (open) {
        siteNav.style.maxHeight = siteNav.scrollHeight + 'px';
        siteHeader.classList.add('nav-open');
        navToggle.innerHTML = closeIcon;
        navToggle.setAttribute('aria-label', 'Close menu');
    } else {
        siteNav.style.maxHeight = '';
        siteHeader.classList.remove('nav-open');
        navToggle.innerHTML = menuIcon;
        navToggle.setAttribute('aria-label', 'Menu');
    }
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

navToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setMenuOpen(!siteHeader.classList.contains('nav-open'));
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && siteHeader.classList.contains('nav-open')) {
        setMenuOpen(false);
        navToggle.focus();
    }
});

document.addEventListener('click', function (e) {
    if (siteHeader.classList.contains('nav-open') && !siteHeader.contains(e.target)) {
        setMenuOpen(false);
    }
});

setMenuOpen(false);
