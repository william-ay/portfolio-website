var articleRows = document.querySelectorAll('.article-row');
var featuredArticle = document.querySelector('.article-featured');
var articleList = document.querySelector('.article-list');
var pagination = document.querySelector('.pagination');
var articlesPerPage = 8;
var totalPages = Math.ceil(articleRows.length / articlesPerPage);
var currentPage = 1;
var pageButtons = [];
var prevPageButton = null;
var nextPageButton = null;
var pageChanging = false;
var pageFadeTime = 200;

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pageFadeTime = 0;
}

function showPage(page) {
    var first = (page - 1) * articlesPerPage;
    var last = first + articlesPerPage;
    currentPage = page;

    for (var i = 0; i < articleRows.length; i++) {
        if (i >= first && i < last) {
            articleRows[i].classList.remove('article-hidden');
        } else {
            articleRows[i].classList.add('article-hidden');
        }

        if (i === first) {
            articleRows[i].classList.add('article-row-first');
        } else {
            articleRows[i].classList.remove('article-row-first');
        }
    }

    if (page === 1) {
        featuredArticle.classList.remove('article-hidden');
    } else {
        featuredArticle.classList.add('article-hidden');
    }

    for (var j = 0; j < pageButtons.length; j++) {
        if (j === page - 1) {
            pageButtons[j].setAttribute('aria-current', 'page');
        } else {
            pageButtons[j].removeAttribute('aria-current');
        }
    }

    prevPageButton.disabled = page === 1;
    nextPageButton.disabled = page === totalPages;
}

function finishPageChange(page) {
    var usedButton = document.activeElement;

    showPage(page);

    if (page === 1) {
        history.pushState(null, '', window.location.pathname);
    } else {
        history.pushState(null, '', '?page=' + page);
    }

    if (usedButton.disabled) {
        pageButtons[page - 1].focus({ preventScroll: true });
    }

    articleList.offsetWidth;
    articleList.classList.remove('page-changing');
    featuredArticle.classList.remove('page-changing');
    pageChanging = false;
}

function goToPage(page) {
    if (page === currentPage || pageChanging) {
        return;
    }

    pageChanging = true;
    articleList.classList.add('page-changing');
    featuredArticle.classList.add('page-changing');

    setTimeout(function () {
        finishPageChange(page);
    }, pageFadeTime);
}

function readPageFromAddress() {
    var address = new URLSearchParams(window.location.search);
    var page = parseInt(address.get('page'), 10);

    if (page >= 1 && page <= totalPages) {
        return page;
    }
    return 1;
}

function makePageButton(text, label, className, parent) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-button ' + className;
    button.textContent = text;
    button.setAttribute('aria-label', label);
    parent.appendChild(button);
    return button;
}

function addPageDot(page, parent) {
    var button = makePageButton('', 'Page ' + page, 'page-dot', parent);
    button.addEventListener('click', function () {
        goToPage(page);
    });
    pageButtons.push(button);
}

if (totalPages > 1) {
    prevPageButton = makePageButton('←', 'Previous page', 'page-arrow', pagination);
    prevPageButton.addEventListener('click', function () {
        goToPage(currentPage - 1);
    });

    var dotRow = document.createElement('div');
    dotRow.className = 'page-dots';
    pagination.appendChild(dotRow);

    for (var p = 1; p <= totalPages; p++) {
        addPageDot(p, dotRow);
    }

    nextPageButton = makePageButton('→', 'Next page', 'page-arrow', pagination);
    nextPageButton.addEventListener('click', function () {
        goToPage(currentPage + 1);
    });

    window.addEventListener('popstate', function () {
        showPage(readPageFromAddress());
    });

    showPage(readPageFromAddress());
}
