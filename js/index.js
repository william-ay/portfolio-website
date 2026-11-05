var projectCards = document.querySelectorAll('[data-modal]');

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
}

var projectTrack = document.querySelector('.project-track');

if (projectTrack) {
    var projectCarousel = document.querySelector('.project-carousel');
    var projectViewport = document.querySelector('.project-viewport');
    var projectSlides = projectTrack.querySelectorAll('.project');
    var prevButton = document.querySelector('.project-prev');
    var nextButton = document.querySelector('.project-next');
    var projectCount = document.querySelector('.project-count');
    var currentProject = 0;
    var projectSliding = false;
    var projectTimer = null;
    var projectDelay = 15000;
    var projectSlideTime = 820;
    var touchStartX = 0;
    var touchStartY = 0;

    var firstCopy = projectSlides[0].cloneNode(true);
    var lastCopy = projectSlides[projectSlides.length - 1].cloneNode(true);
    firstCopy.setAttribute('inert', '');
    firstCopy.setAttribute('aria-hidden', 'true');
    lastCopy.setAttribute('inert', '');
    lastCopy.setAttribute('aria-hidden', 'true');
    projectTrack.appendChild(firstCopy);
    projectTrack.insertBefore(lastCopy, projectSlides[0]);

    function moveTrack(index) {
        projectTrack.style.transform = 'translateX(-' + ((index + 1) * 100) + '%)';
    }

    function jumpTrack(index) {
        projectTrack.style.transition = 'none';
        moveTrack(index);
        projectTrack.offsetWidth;
        projectTrack.style.transition = '';
    }

    function markProject(index) {
        for (var i = 0; i < projectSlides.length; i++) {
            if (i === index) {
                projectSlides[i].removeAttribute('inert');
                projectSlides[i].removeAttribute('aria-hidden');
            } else {
                projectSlides[i].setAttribute('inert', '');
                projectSlides[i].setAttribute('aria-hidden', 'true');
            }
        }
        projectCount.textContent = (index + 1) + ' / ' + projectSlides.length;
    }

    function showProject(index) {
        if (projectSliding) {
            return;
        }
        projectSliding = true;
        moveTrack(index);

        var realIndex = index;
        if (index < 0) {
            realIndex = projectSlides.length - 1;
        }
        if (index >= projectSlides.length) {
            realIndex = 0;
        }
        currentProject = realIndex;
        markProject(realIndex);

        setTimeout(function () {
            jumpTrack(realIndex);
            projectSliding = false;
        }, projectSlideTime);
    }

    function stopProjectTimer() {
        clearInterval(projectTimer);
    }

    function startProjectTimer() {
        stopProjectTimer();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        projectTimer = setInterval(function () {
            if (!document.hidden) {
                showProject(currentProject + 1);
            }
        }, projectDelay);
    }

    prevButton.addEventListener('click', function () {
        showProject(currentProject - 1);
        startProjectTimer();
    });

    nextButton.addEventListener('click', function () {
        showProject(currentProject + 1);
        startProjectTimer();
    });

    projectCarousel.addEventListener('mouseenter', stopProjectTimer);
    projectCarousel.addEventListener('mouseleave', startProjectTimer);
    projectCarousel.addEventListener('focusin', stopProjectTimer);
    projectCarousel.addEventListener('focusout', startProjectTimer);

    projectViewport.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    });

    projectViewport.addEventListener('touchend', function (e) {
        var distanceX = e.changedTouches[0].clientX - touchStartX;
        var distanceY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(distanceX) < 50 || Math.abs(distanceY) > Math.abs(distanceX)) {
            return;
        }
        if (distanceX > 0) {
            showProject(currentProject - 1);
        } else {
            showProject(currentProject + 1);
        }
        startProjectTimer();
    });

    jumpTrack(0);
    markProject(0);
    startProjectTimer();
}
