var contactDialog = document.getElementById('contact-dialog');
var contactLinks = document.querySelectorAll('[data-contact]');
var contactForm = document.getElementById('contact-form');
var contactEmail = 'william.awe06@ed.cna.nl.ca';
var contactBody = document.getElementById('contact-body');
var contactBodyMinimum = 10;

for (var i = 0; i < contactLinks.length; i++) {
    contactLinks[i].addEventListener('click', function (e) {
        e.preventDefault();
        contactDialog.showModal();
    });
}

contactDialog.querySelector('.contact-close').addEventListener('click', function () {
    contactDialog.close();
});

contactDialog.addEventListener('click', function (e) {
    if (e.target === contactDialog) {
        contactDialog.close();
    }
});

function checkBodyLength() {
    if (contactBody.value.trim().length < contactBodyMinimum) {
        contactBody.setCustomValidity('Please write at least ' + contactBodyMinimum + ' characters.');
    } else {
        contactBody.setCustomValidity('');
    }
}

contactBody.addEventListener('input', checkBodyLength);
checkBodyLength();

function buildMailLink(subject, body) {
    return 'mailto:' + contactEmail +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n'));
}

contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var subject = document.getElementById('contact-subject').value;
    var body = contactBody.value;
    window.location.href = buildMailLink(subject, body);
    contactDialog.close();
});
