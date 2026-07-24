var typingEl = document.getElementById('typing');
if (typingEl) {
    var fullText = typingEl.getAttribute('data-text');
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '|';
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
        typingEl.textContent = fullText;
        typingEl.appendChild(caret);
    } else {
        typingEl.textContent = '';
        var typeIndex = 0;
        function typeNext() {
            if (typeIndex < fullText.length) {
                typingEl.textContent = fullText.slice(0, typeIndex + 1);
                typeIndex++;
                setTimeout(typeNext, 80);
            } else {
                typingEl.appendChild(caret);
            }
        }
        typeNext();
    }
}

var projectCards = document.querySelectorAll('[data-modal]');
var modals = document.querySelectorAll('.modal');
var closeButtons = document.querySelectorAll('[data-close]');

var chessStarted = false;

function initChessModal(modal) {
    if (chessStarted) {
        return;
    }
    var rootEl = document.getElementById('chess-root');
    if (rootEl && window.chessAppInit) {
        chessStarted = true;
        window.chessAppInit(rootEl, {
            onClose: function () {
                modal.classList.remove('open');
            }
        });
    }
}

function openModal() {
    var id = this.getAttribute('data-modal');
    var modal = document.getElementById(id);
    modal.classList.add('open');
    if (id === 'modal-chess') {
        initChessModal(modal);
    }
}

for (var i = 0; i < projectCards.length; i++) {
    projectCards[i].addEventListener('click', openModal);
    projectCards[i].addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal.call(this);
        }
    });
}

for (var i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener('click', function () {
        this.closest('.modal').classList.remove('open');
    });
}

for (var i = 0; i < modals.length; i++) {
    modals[i].addEventListener('click', function (e) {
        if (e.target === this && this.id !== 'modal-chess') {
            this.classList.remove('open');
        }
    });
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        for (var i = 0; i < modals.length; i++) {
            if (modals[i].id !== 'modal-chess') {
                modals[i].classList.remove('open');
            }
        }
    }
});

var navToggle = document.querySelector('.nav-toggle');
var header = document.querySelector('header');
var navLinks = document.querySelectorAll('.nav-bar a');

function closeNav() {
    header.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
}

if (navToggle && header) {
    navToggle.addEventListener('click', function () {
        var isOpen = header.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].addEventListener('click', closeNav);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeNav();
        }
    });
}
