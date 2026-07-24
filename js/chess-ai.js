var ENGINE_URL = 'js/vendor/stockfish.js';

function createEngine() {
    var worker = new Worker(ENGINE_URL);
    var ready = false;
    var readyWaiters = [];
    var queue = [];
    var current = null;

    function line(data) {
        if (typeof data === 'string') {
            return data;
        }
        if (data && typeof data.data === 'string') {
            return data.data;
        }
        return '';
    }

    function pump() {
        if (current || queue.length === 0) {
            return;
        }
        current = queue.shift();
        if (current.skill !== undefined && current.skill !== null) {
            worker.postMessage('setoption name Skill Level value ' + current.skill);
        }
        worker.postMessage('position fen ' + current.fen);
        worker.postMessage('go depth ' + current.depth);
    }

    worker.onmessage = function (e) {
        var text = line(e.data);
        if (text === 'uciok') {
            worker.postMessage('isready');
        } else if (text === 'readyok') {
            ready = true;
            for (var i = 0; i < readyWaiters.length; i++) {
                readyWaiters[i]();
            }
            readyWaiters = [];
        } else if (text.indexOf('bestmove') === 0) {
            var move = text.split(' ')[1];
            if (current) {
                var done = current;
                current = null;
                done.resolve(move);
                pump();
            }
        }
    };

    worker.postMessage('uci');

    function whenReady() {
        return new Promise(function (resolve) {
            if (ready) {
                resolve();
            } else {
                readyWaiters.push(resolve);
            }
        });
    }

    return {
        isReady: function () {
            return ready;
        },
        whenReady: whenReady,
        getBestMove: function (fen, opts) {
            opts = opts || {};
            return whenReady().then(function () {
                return new Promise(function (resolve) {
                    queue.push({ fen: fen, skill: opts.skill, depth: opts.depth || 12, resolve: resolve });
                    pump();
                });
            });
        },
        quit: function () {
            worker.postMessage('quit');
            worker.terminate();
        }
    };
}

export { createEngine };
