import { Chess } from './vendor/chess.js';

var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var PIECE_SRC = 'images/chess/cburnett/';
var AI_NAME = 'Savant Frutty';
var ANIM_MS = 0;

var LEVELS = {
    beginner: { skill: 0, depth: 1 },
    intermediate: { skill: 5, depth: 4 },
    hard: { skill: 13, depth: 9 },
    grandmaster: { skill: 20, depth: 14 }
};

function pieceFile(piece) {
    return PIECE_SRC + piece.color + piece.type.toUpperCase() + '.svg';
}

var PIECE_NAMES = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };

function describeMove(mv) {
    if (!mv) {
        return '';
    }
    if (mv.flags && mv.flags.indexOf('k') !== -1) {
        return 'castles kingside';
    }
    if (mv.flags && mv.flags.indexOf('q') !== -1) {
        return 'castles queenside';
    }
    var name = PIECE_NAMES[mv.piece] || 'Piece';
    var text = name + (mv.captured ? ' takes ' : ' to ') + mv.to;
    if (mv.promotion) {
        text += ', promotes to ' + (PIECE_NAMES[mv.promotion] || 'Queen');
    }
    return text;
}

function ChessGame(root, options) {
    options = options || {};
    this.root = root;
    this.game = new Chess();
    this.orientation = options.orientation || 'w';
    this.humanColor = options.humanColor || 'w';
    this.level = options.level || 'intermediate';
    this.engine = options.engine || null;
    this.onGameOver = options.onGameOver || null;
    this.onMove = options.onMove || null;
    this.gameOverFired = false;
    this.lastAiMove = null;
    this.destroyed = false;
    this.finished = false;
    this.thinking = false;
    this.whiteCaptures = [];
    this.blackCaptures = [];
    this.selected = null;
    this.legalTargets = {};
    this.squares = {};
    if (options.moves && options.moves.length) {
        for (var m = 0; m < options.moves.length; m++) {
            try {
                var rmv = this.game.move(options.moves[m]);
                this.recordCapture(rmv);
            } catch (e) {
                break;
            }
        }
    }
    this.build();
    this.render();
    this.maybeAiMove();
}

ChessGame.prototype.build = function () {
    this.status = document.createElement('div');
    this.status.className = 'chess-status';
    this.captureTop = document.createElement('div');
    this.captureTop.className = 'chess-tray';
    this.boardWrap = document.createElement('div');
    this.boardWrap.className = 'chess-board-wrap';
    this.ranksEl = document.createElement('div');
    this.ranksEl.className = 'chess-ranks';
    this.filesEl = document.createElement('div');
    this.filesEl.className = 'chess-files';
    this.boardEl = document.createElement('div');
    this.boardEl.className = 'chess-board';
    this.boardWrap.appendChild(this.ranksEl);
    this.boardWrap.appendChild(this.boardEl);
    this.boardWrap.appendChild(this.filesEl);
    this.captureBottom = document.createElement('div');
    this.captureBottom.className = 'chess-tray';
    this.root.appendChild(this.status);
    this.root.appendChild(this.captureTop);
    this.root.appendChild(this.boardWrap);
    this.root.appendChild(this.captureBottom);

    var self = this;
    this.boardEl.addEventListener('click', function (e) {
        self.onClick(e);
    });

    var rows = this.orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    var cols = this.orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    var rankHtml = '';
    for (var r = 0; r < rows.length; r++) {
        rankHtml += '<span>' + rows[r] + '</span>';
    }
    this.ranksEl.innerHTML = rankHtml;

    var fileHtml = '';
    for (var f = 0; f < cols.length; f++) {
        fileHtml += '<span>' + FILES[cols[f]] + '</span>';
    }
    this.filesEl.innerHTML = fileHtml;

    for (var i = 0; i < rows.length; i++) {
        var rank = rows[i];
        for (var j = 0; j < cols.length; j++) {
            var c = cols[j];
            var sqName = FILES[c] + rank;
            var el = document.createElement('div');
            el.className = 'csq ' + (((c + rank) % 2 === 0) ? 'light' : 'dark');
            el.dataset.sq = sqName;
            this.boardEl.appendChild(el);
            this.squares[sqName] = el;
        }
    }
};

ChessGame.prototype.pieceAt = function (sq) {
    var file = FILES.indexOf(sq.charAt(0));
    var rank = parseInt(sq.charAt(1), 10);
    var board = this.game.board();
    return board[8 - rank][file];
};

ChessGame.prototype.findKing = function (color) {
    var board = this.game.board();
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var p = board[r][c];
            if (p && p.type === 'k' && p.color === color) {
                return FILES[c] + (8 - r);
            }
        }
    }
    return null;
};

ChessGame.prototype.render = function () {
    var sq;
    for (sq in this.squares) {
        var el = this.squares[sq];
        el.classList.remove('sel', 'move', 'capture', 'last', 'check');
        var old = el.querySelector('.cpiece');
        if (old) {
            old.remove();
        }
    }

    var board = this.game.board();
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var p = board[r][c];
            if (p) {
                var sqName = FILES[c] + (8 - r);
                var img = document.createElement('img');
                img.className = 'cpiece ' + (p.color === 'w' ? 'white' : 'black');
                img.src = pieceFile(p);
                img.alt = '';
                this.squares[sqName].appendChild(img);
            }
        }
    }

    var hist = this.game.history({ verbose: true });
    if (hist.length) {
        var lm = hist[hist.length - 1];
        if (this.squares[lm.from]) this.squares[lm.from].classList.add('last');
        if (this.squares[lm.to]) this.squares[lm.to].classList.add('last');
    }

    if (this.game.isCheck()) {
        var kingSq = this.findKing(this.game.turn());
        if (kingSq && this.squares[kingSq]) {
            this.squares[kingSq].classList.add('check');
        }
    }

    if (this.selected) {
        if (this.squares[this.selected]) {
            this.squares[this.selected].classList.add('sel');
        }
        for (var to in this.legalTargets) {
            if (this.squares[to]) {
                this.squares[to].classList.add(this.legalTargets[to].captured ? 'capture' : 'move');
            }
        }
    }

    this.renderCaptures();
    this.updateStatus();
};

ChessGame.prototype.animateMove = function (from, to) {
    if (ANIM_MS <= 0) {
        return;
    }
    var fromSq = this.squares[from];
    var toSq = this.squares[to];
    if (!fromSq || !toSq) {
        return;
    }
    var piece = toSq.querySelector('.cpiece');
    if (!piece) {
        return;
    }
    var dx = fromSq.offsetLeft - toSq.offsetLeft;
    var dy = fromSq.offsetTop - toSq.offsetTop;
    piece.style.transition = 'none';
    piece.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    piece.getBoundingClientRect();
    piece.style.transition = 'transform ' + ANIM_MS + 'ms ease';
    piece.style.transform = 'translate(0, 0)';
};

ChessGame.prototype.destroy = function () {
    this.destroyed = true;
    var overlay = this.root.querySelector('.chess-promo');
    if (overlay) {
        overlay.remove();
    }
};

ChessGame.prototype.resign = function () {
    if (this.gameOverFired) {
        return;
    }
    this.gameOverFired = true;
    this.finished = true;
    if (this.onGameOver) {
        this.onGameOver({ type: 'resign', winner: this.humanColor === 'w' ? 'b' : 'w', humanWon: false });
    }
};

ChessGame.prototype.notifyMove = function () {
    if (this.onMove) {
        this.onMove(this);
    }
};

ChessGame.prototype.recordCapture = function (mv) {
    if (mv && mv.captured) {
        var capturedColor = mv.color === 'w' ? 'b' : 'w';
        var entry = { color: capturedColor, type: mv.captured };
        if (mv.color === 'w') {
            this.whiteCaptures.push(entry);
        } else {
            this.blackCaptures.push(entry);
        }
    }
};

ChessGame.prototype.trayHtml = function (list) {
    var s = '';
    for (var i = 0; i < list.length; i++) {
        s += '<img class="ctray-piece" src="' + PIECE_SRC + list[i].color + list[i].type.toUpperCase() + '.svg" alt="">';
    }
    return s;
};

ChessGame.prototype.renderCaptures = function () {
    var bottom = this.humanColor === 'w' ? this.whiteCaptures : this.blackCaptures;
    var top = this.humanColor === 'w' ? this.blackCaptures : this.whiteCaptures;
    this.captureBottom.innerHTML = this.trayHtml(bottom);
    this.captureTop.innerHTML = this.trayHtml(top);
};

ChessGame.prototype.onClick = function (e) {
    if (this.thinking || this.finished || this.game.isGameOver()) {
        return;
    }
    if (this.game.turn() !== this.humanColor) {
        return;
    }
    var el = e.target.closest('.csq');
    if (!el) {
        return;
    }
    var sq = el.dataset.sq;

    if (this.selected && this.legalTargets[sq]) {
        this.doMove(this.selected, sq);
        return;
    }

    var piece = this.pieceAt(sq);
    if (piece && piece.color === this.humanColor) {
        this.selected = sq;
        this.legalTargets = {};
        var moves = this.game.moves({ square: sq, verbose: true });
        for (var i = 0; i < moves.length; i++) {
            this.legalTargets[moves[i].to] = moves[i];
        }
    } else {
        this.selected = null;
        this.legalTargets = {};
    }
    this.render();
};

ChessGame.prototype.doMove = function (from, to) {
    var mv = this.legalTargets[to];
    if (mv && mv.promotion) {
        this.selected = null;
        this.legalTargets = {};
        this.render();
        this.showPromotion(from, to);
        return;
    }
    var mv;
    try {
        mv = this.game.move({ from: from, to: to });
    } catch (err) {
        return;
    }
    this.recordCapture(mv);
    this.selected = null;
    this.legalTargets = {};
    this.render();
    this.animateMove(from, to);
    this.notifyMove();
    this.checkGameOver();
    this.maybeAiMove();
};

ChessGame.prototype.showPromotion = function (from, to) {
    var self = this;
    var color = this.humanColor;
    var options = ['q', 'r', 'b', 'n'];
    var overlay = document.createElement('div');
    overlay.className = 'chess-promo';
    var html = '<div class="chess-promo-box"><p class="chess-promo-title">Promote to</p><div class="chess-promo-pieces">';
    for (var i = 0; i < options.length; i++) {
        html += '<button class="chess-promo-btn" data-piece="' + options[i] + '">' +
            '<img src="' + PIECE_SRC + color + options[i].toUpperCase() + '.svg" alt=""></button>';
    }
    html += '</div></div>';
    overlay.innerHTML = html;
    this.root.appendChild(overlay);

    var btns = overlay.querySelectorAll('.chess-promo-btn');
    for (var b = 0; b < btns.length; b++) {
        btns[b].addEventListener('click', function () {
            var piece = this.getAttribute('data-piece');
            overlay.remove();
            var pmv;
            try {
                pmv = self.game.move({ from: from, to: to, promotion: piece });
            } catch (err) {
                self.render();
                return;
            }
            self.recordCapture(pmv);
            self.render();
            self.animateMove(from, to);
            self.notifyMove();
            self.checkGameOver();
            self.maybeAiMove();
        });
    }
};

ChessGame.prototype.checkGameOver = function () {
    if (this.gameOverFired || !this.game.isGameOver()) {
        return;
    }
    this.gameOverFired = true;
    var result;
    if (this.game.isCheckmate()) {
        var loser = this.game.turn();
        var winner = loser === 'w' ? 'b' : 'w';
        result = { type: 'checkmate', winner: winner, humanWon: winner === this.humanColor };
    } else if (this.game.isStalemate()) {
        result = { type: 'stalemate', winner: null, humanWon: null };
    } else if (this.game.isThreefoldRepetition()) {
        result = { type: 'repetition', winner: null, humanWon: null };
    } else if (this.game.isInsufficientMaterial()) {
        result = { type: 'insufficient', winner: null, humanWon: null };
    } else {
        result = { type: 'draw', winner: null, humanWon: null };
    }
    if (this.onGameOver) {
        this.onGameOver(result);
    }
};

ChessGame.prototype.maybeAiMove = function () {
    if (this.destroyed || !this.engine || this.game.isGameOver()) {
        return;
    }
    if (this.game.turn() === this.humanColor) {
        return;
    }
    var self = this;
    this.thinking = true;
    this.status.textContent = this.engine.isReady() ? (AI_NAME + ' is thinking…') : ('Loading ' + AI_NAME + '…');
    var cfg = LEVELS[this.level] || LEVELS.intermediate;
    var fen = this.game.fen();
    var minThink = 800;
    var start = Date.now();
    this.engine.getBestMove(fen, { skill: cfg.skill, depth: cfg.depth }).then(function (uci) {
        if (self.destroyed) {
            return;
        }
        var wait = Math.max(0, minThink - (Date.now() - start));
        setTimeout(function () {
            if (self.destroyed) {
                return;
            }
            self.thinking = false;
            if (!uci || uci === '(none)') {
                self.render();
                return;
            }
            var opts = { from: uci.substr(0, 2), to: uci.substr(2, 2) };
            if (uci.length > 4) {
                opts.promotion = uci.charAt(4);
            }
            var moveObj;
            try {
                moveObj = self.game.move(opts);
            } catch (err) {
                self.render();
                return;
            }
            self.lastAiMove = moveObj ? describeMove(moveObj) : null;
            self.recordCapture(moveObj);
            self.render();
            self.animateMove(opts.from, opts.to);
            self.notifyMove();
            self.checkGameOver();
        }, wait);
    });
};

ChessGame.prototype.updateStatus = function () {
    var msg;
    if (this.game.isCheckmate()) {
        msg = 'Checkmate — ' + (this.game.turn() === 'w' ? 'Black' : 'White') + ' wins';
    } else if (this.game.isStalemate()) {
        msg = 'Stalemate — draw';
    } else if (this.game.isInsufficientMaterial()) {
        msg = 'Draw — insufficient material';
    } else if (this.game.isThreefoldRepetition()) {
        msg = 'Draw — threefold repetition';
    } else if (this.game.isDraw()) {
        msg = 'Draw';
    } else if (this.game.turn() === this.humanColor) {
        msg = this.lastAiMove ? (AI_NAME + ' played ' + this.lastAiMove + ' — your move') : 'Your move';
        if (this.game.isCheck()) {
            msg += ' — check!';
        }
    } else {
        msg = AI_NAME + ' is thinking…';
    }
    this.status.textContent = msg;
};

export { ChessGame };
