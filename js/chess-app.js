import { ChessGame } from './chess-ui.js';
import { createEngine } from './chess-ai.js';

var SPARK = '<svg class="chess-spark" viewBox="0 0 24 24"><path d="M12 0c1 8 3 10 12 12-9 2-11 4-12 12-1-8-3-10-12-12 9-2 11-4 12-12z"/></svg>';
var SOUND_ICONS =
    '<svg class="snd-on" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8c1.6 1.6 1.6 6.4 0 8"/></svg>' +
    '<svg class="snd-off" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>';
var CLOSE_ICON = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
var ARROW_L = '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
var ARROW_R = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function pieceRow(code, name, desc) {
    return '<li><img src="images/chess/cburnett/' + code + '.svg" alt=""><span><b>' + name + '</b> — ' + desc + '</span></li>';
}

var HOWTO = [
    {
        title: 'The goal',
        icon: 'bK',
        html: '<p>Win by <b>checkmating</b> the enemy king — attacking it so it has no legal way to escape. That ends the game.</p>'
    },
    {
        title: 'Making a move',
        icon: 'bN',
        html: '<p>Tap one of your pieces to see where it can go (the dots). Tap a dot to move there, or a ringed square to capture.</p>'
    },
    {
        title: 'How the pieces move',
        html: '<ul class="chess-pieces-help">' +
            pieceRow('bP', 'Pawn', 'forward one square (two on its first move); captures diagonally.') +
            pieceRow('bN', 'Knight', 'in an L-shape, and it can jump over other pieces.') +
            pieceRow('bB', 'Bishop', 'diagonally, any number of squares.') +
            pieceRow('bR', 'Rook', 'in straight lines, any number of squares.') +
            pieceRow('bQ', 'Queen', 'any direction, any number of squares.') +
            pieceRow('bK', 'King', 'one square in any direction.') +
            '</ul>'
    },
    {
        title: 'Check & checkmate',
        icon: 'bK',
        html: '<p>When your king is under attack, that is <b>check</b> — you must respond. If there is no escape, it is <b>checkmate</b> and the game ends.</p>'
    },
    {
        title: 'Special moves',
        html: '<ul class="chess-pieces-help">' +
            pieceRow('bK', 'Castling', 'tuck your king to safety beside a rook.') +
            pieceRow('bP', 'En passant', 'a special one-time pawn capture.') +
            pieceRow('bQ', 'Promotion', 'a pawn reaching the far side becomes a new piece, usually a queen.') +
            '</ul>'
    },
    {
        title: 'Playing Savant Frutty',
        icon: 'bQ',
        html: '<p>Pick a difficulty from Beginner to Grandmaster and your colour, then play. A game with no winner — stalemate, repetition, or too few pieces — is a <b>draw</b>. Good luck!</p>'
    }
];

var SAVE_KEY = 'chessMastersGame';
var PREF_KEY = 'chessMastersPrefs';

function readJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (e) {
        return null;
    }
}

function writeJson(key, obj) {
    try {
        localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {
    }
}

function removeKey(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
    }
}

var LEVEL_LABELS = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    hard: 'Hard',
    grandmaster: 'Grandmaster'
};

function choiceHtml(group, val, label) {
    return '<button class="chess-choice" data-group="' + group + '" data-val="' + val + '">' + label + '</button>';
}

function levelChoiceHtml(val, label, piece) {
    return '<button class="chess-choice chess-choice-piece" data-group="level" data-val="' + val + '">' +
        '<span class="cpc-icon"><img src="images/chess/cburnett/' + piece + '.svg" alt=""></span>' +
        '<span class="cpc-label">' + label + '</span>' +
        '</button>';
}

function artHtml() {
    return '<div class="chess-art"><span class="chess-king">&#9819;</span>' + SPARK + SPARK + '</div>';
}

function initChessApp(root, options) {
    options = options || {};
    var engine = createEngine();
    var state = { level: 'intermediate', color: 'w' };
    var currentGame = null;

    function destroyGame() {
        if (currentGame) {
            currentGame.destroy();
            currentGame = null;
        }
    }

    root.innerHTML =
        '<div class="chess-app">' +
            '<div class="chess-topbar">' +
                '<button class="chess-icon-btn" data-sound aria-label="toggle music">' + SOUND_ICONS + '</button>' +
                '<div class="chess-title"><h2>Chess Masters</h2><p class="chess-sub">new game</p></div>' +
                '<button class="chess-icon-btn" data-close aria-label="close">' + CLOSE_ICON + '</button>' +
            '</div>' +
            '<div class="chess-body"></div>' +
        '</div>';

    var body = root.querySelector('.chess-body');
    var soundBtn = root.querySelector('[data-sound]');
    var sub = root.querySelector('.chess-sub');

    function persistGame(g) {
        writeJson(SAVE_KEY, { humanColor: g.humanColor, level: g.level, moves: g.game.history() });
    }

    function savePrefs() {
        writeJson(PREF_KEY, { level: state.level, color: state.color, muted: soundBtn.classList.contains('muted') });
    }

    var prefs = readJson(PREF_KEY);
    if (prefs) {
        if (prefs.level) {
            state.level = prefs.level;
        }
        if (prefs.color) {
            state.color = prefs.color;
        }
        if (prefs.muted) {
            soundBtn.classList.add('muted');
        }
    }

    soundBtn.addEventListener('click', function () {
        soundBtn.classList.toggle('muted');
        savePrefs();
    });
    root.querySelector('[data-close]').addEventListener('click', showExitConfirm);

    function close() {
        if (typeof options.onClose === 'function') {
            options.onClose();
        }
    }

    function overlayHost() {
        return root.closest('.modal-box') || root.querySelector('.chess-app');
    }

    function setSub(text) {
        sub.textContent = text;
    }

    function on(sel, handler) {
        var el = body.querySelector(sel);
        if (el) {
            el.addEventListener('click', handler);
        }
    }

    function showMenu() {
        destroyGame();
        setSub('new game');
        var saved = readJson(SAVE_KEY);
        var canResume = saved && saved.moves && saved.moves.length;
        var resumeBtn = canResume
            ? '<button class="chess-btn primary" data-resume>' + SPARK + '<span>Resume game</span>' + SPARK + '</button>'
            : '';
        var playBtn = canResume
            ? '<button class="chess-btn" data-play><span>New game</span></button>'
            : '<button class="chess-btn primary" data-play>' + SPARK + '<span>Play</span>' + SPARK + '</button>';
        body.innerHTML =
            artHtml() +
            '<div class="chess-menu">' +
                resumeBtn +
                playBtn +
                '<button class="chess-btn" data-howto>How to Play</button>' +
                '<button class="chess-btn" data-quit>Quit</button>' +
            '</div>' +
            '<p class="chess-credit">Engine: <a href="https://stockfishchess.org" target="_blank" rel="noopener">Stockfish</a> (GPL-3.0) &middot; pieces: cburnett</p>';
        if (canResume) {
            on('[data-resume]', function () {
                startGame(saved);
            });
        }
        on('[data-play]', showSetup);
        on('[data-howto]', showHowTo);
        on('[data-quit]', showExitConfirm);
    }

    function showSetup() {
        setSub('choose your game');
        body.innerHTML =
            '<div class="chess-section">' +
                '<p class="chess-label">Difficulty</p>' +
                '<div class="chess-choices chess-choices-level">' +
                    levelChoiceHtml('beginner', 'Beginner', 'bP') +
                    levelChoiceHtml('intermediate', 'Intermediate', 'bN') +
                    levelChoiceHtml('hard', 'Hard', 'bR') +
                    levelChoiceHtml('grandmaster', 'Grandmaster', 'bQ') +
                '</div>' +
            '</div>' +
            '<div class="chess-section">' +
                '<p class="chess-label">Play as</p>' +
                '<div class="chess-choices">' +
                    choiceHtml('color', 'w', 'White') +
                    choiceHtml('color', 'b', 'Black') +
                    choiceHtml('color', 'random', 'Random') +
                '</div>' +
            '</div>' +
            '<button class="chess-btn primary" data-start>' + SPARK + '<span>Start</span>' + SPARK + '</button>' +
            '<button class="chess-btn chess-btn-back" data-back>Back</button>';

        var choices = body.querySelectorAll('.chess-choice');
        for (var i = 0; i < choices.length; i++) {
            choices[i].addEventListener('click', function () {
                var group = this.getAttribute('data-group');
                state[group] = this.getAttribute('data-val');
                var peers = body.querySelectorAll('.chess-choice[data-group="' + group + '"]');
                for (var j = 0; j < peers.length; j++) {
                    peers[j].classList.remove('active');
                }
                this.classList.add('active');
                savePrefs();
            });
        }
        markActive('level', state.level);
        markActive('color', state.color);
        on('[data-start]', startGame);
        on('[data-back]', showMenu);
    }

    function markActive(group, val) {
        var el = body.querySelector('.chess-choice[data-group="' + group + '"][data-val="' + val + '"]');
        if (el) {
            el.classList.add('active');
        }
    }

    function showHowTo() {
        setSub('how to play');
        var idx = 0;
        body.innerHTML =
            '<div class="chess-slides">' +
                '<button class="chess-icon-btn chess-arrow" data-prev aria-label="previous">' + ARROW_L + '</button>' +
                '<div class="chess-slide"></div>' +
                '<button class="chess-icon-btn chess-arrow" data-next aria-label="next">' + ARROW_R + '</button>' +
            '</div>' +
            '<div class="chess-dots"></div>' +
            '<button class="chess-btn chess-btn-back" data-back>Back</button>';

        var slideEl = body.querySelector('.chess-slide');
        var prevBtn = body.querySelector('[data-prev]');
        var nextBtn = body.querySelector('[data-next]');
        var dotsEl = body.querySelector('.chess-dots');

        function renderSlide() {
            var s = HOWTO[idx];
            var iconHtml = s.icon ? '<img class="chess-slide-icon" src="images/chess/cburnett/' + s.icon + '.svg" alt="">' : '';
            slideEl.innerHTML = iconHtml + '<h3>' + s.title + '</h3>' + s.html;
            prevBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
            nextBtn.style.visibility = idx === HOWTO.length - 1 ? 'hidden' : 'visible';
            var d = '';
            for (var i = 0; i < HOWTO.length; i++) {
                d += '<span class="chess-dot' + (i === idx ? ' active' : '') + '"></span>';
            }
            dotsEl.innerHTML = d;
        }

        prevBtn.addEventListener('click', function () {
            if (idx > 0) {
                idx--;
                renderSlide();
            }
        });
        nextBtn.addEventListener('click', function () {
            if (idx < HOWTO.length - 1) {
                idx++;
                renderSlide();
            }
        });
        on('[data-back]', showMenu);
        renderSlide();
    }

    function startGame(restore) {
        destroyGame();
        var human, level, moves;
        if (restore) {
            human = restore.humanColor;
            level = restore.level;
            moves = restore.moves;
        } else {
            human = state.color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : state.color;
            level = state.level;
            moves = null;
            savePrefs();
        }
        setSub(LEVEL_LABELS[level] || 'game');
        body.innerHTML =
            '<div class="chess-mount"></div>' +
            '<div class="chess-controls">' +
                '<button class="chess-btn" data-newgame>New game</button>' +
                '<button class="chess-btn" data-resign>Resign</button>' +
                '<button class="chess-btn" data-menu>Menu</button>' +
            '</div>';
        var mount = body.querySelector('.chess-mount');
        currentGame = new ChessGame(mount, {
            orientation: human,
            humanColor: human,
            level: level,
            engine: engine,
            onGameOver: showEndPopup,
            onMove: persistGame,
            moves: moves
        });
        persistGame(currentGame);
        on('[data-newgame]', function () {
            startGame();
        });
        on('[data-resign]', function () {
            if (currentGame) {
                currentGame.resign();
            }
        });
        on('[data-menu]', showMenu);
    }

    function showEndPopup(result) {
        removeKey(SAVE_KEY);
        var title = 'Draw';
        var subtitle = '';
        if (result.type === 'checkmate') {
            title = result.humanWon ? 'Checkmate — you win!' : 'Checkmate — you lose';
            subtitle = result.humanWon ? 'well played' : 'better luck next time';
        } else if (result.type === 'resign') {
            title = 'You resigned';
            subtitle = 'Savant Frutty wins';
        } else if (result.type === 'stalemate') {
            subtitle = 'stalemate — no legal moves';
        } else if (result.type === 'insufficient') {
            subtitle = 'insufficient material';
        } else if (result.type === 'repetition') {
            subtitle = 'threefold repetition';
        }
        var popup = document.createElement('div');
        popup.className = 'chess-endpopup';
        popup.innerHTML =
            '<div class="chess-endcard">' +
                '<button class="chess-icon-btn chess-end-dismiss" aria-label="dismiss">' + CLOSE_ICON + '</button>' +
                '<h3>' + title + '</h3>' +
                (subtitle ? '<p>' + subtitle + '</p>' : '') +
                '<div class="chess-endactions">' +
                    '<button class="chess-btn primary" data-again>' + SPARK + '<span>Play again</span>' + SPARK + '</button>' +
                    '<button class="chess-btn" data-tomenu>Menu</button>' +
                '</div>' +
            '</div>';
        overlayHost().appendChild(popup);
        popup.querySelector('.chess-end-dismiss').addEventListener('click', function () {
            popup.remove();
        });
        popup.querySelector('[data-again]').addEventListener('click', function () {
            popup.remove();
            startGame();
        });
        popup.querySelector('[data-tomenu]').addEventListener('click', function () {
            popup.remove();
            showMenu();
        });
    }

    function showExitConfirm() {
        if (root.querySelector('.chess-confirm')) {
            return;
        }
        var overlay = document.createElement('div');
        overlay.className = 'chess-confirm';
        overlay.innerHTML =
            '<div class="chess-confirm-card">' +
                '<p class="chess-confirm-text">Are you sure you want to exit the game?</p>' +
                '<div class="chess-confirm-actions">' +
                    '<button class="chess-btn" data-yes>Yes</button>' +
                    '<button class="chess-btn primary" data-no>No</button>' +
                '</div>' +
            '</div>';
        overlayHost().appendChild(overlay);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        overlay.querySelector('[data-yes]').addEventListener('click', function () {
            overlay.remove();
            close();
        });
        overlay.querySelector('[data-no]').addEventListener('click', function () {
            overlay.remove();
        });
    }

    showMenu();
}

window.chessAppInit = initChessApp;

var appRoot = document.getElementById('chess-root');
if (appRoot && !appRoot.closest('.modal')) {
    initChessApp(appRoot);
}

export { initChessApp };
