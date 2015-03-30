function RepeatingOperation (op, yieldEveryIteration) {
    var count = 0;
    var instance = this;
    this.step = function (args) {
        if (++count >= yieldEveryIteration) {
            count = 0;
            setTimeout(function () { op(args); }, 1, []);
            return;
        }
        op(args);
    };
}

module.exports = RepeatingOperation;
