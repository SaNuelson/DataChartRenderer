const fs = require('fs');
const path = require('path');

Array.prototype.random = function () {
    return this[Math.round(Math.random() * this.length)]
}

Array.prototype.between = function () {
    if (this.length !== 2)
        return undefined;
    return Math.random() * (this[1] - this[0]) + this[0];
}

const rand = {
    int: (min, max) => Math.round(Math.random() * (max - min) + min),
    float: (min, max) => Math.random() * (max - min) + min,
    from: (arr) => arr[rand.int(0,arr.length - 1)],
    normal: () => Array.from({length: 10}, Math.random).reduce((a,n) => a + n) / 10,
    gauss: (min, max) => rand.normal() * (max - min) + min
}

const addSeparator = (str, sep, thousandths) => {
    var prefix = "";
    if (str[0] === '-') {
        prefix = "-";
        str = str.slice(1);
    }
    let parts = str.split(/[^0-9-]+/);
    let dSep = str.match(/[^0-9-]+/) ?? "";
    let left = parts[0].match(/.{1,3}(?=(.{3})*$)/g);
    let right = parts.length === 1 ? [""] : thousandths ? parts[1].match(/.{1,3}/g) : [parts[1]];
    return prefix + left.join(sep) + dSep + right.join(sep);
}

const getNum = (min, max, precision) => {
    let num = Math.random() * (max - min) + min;
    return Math.round(num * 10 ** precision) / 10 ** precision;
}

const writeSet = (args) => {
    if (!args) args = {};
    let verbose = args.verbose ?? false;
    let format = {
        decimalDelimiter: args.ds ?? ".",
        thousandsDelimiter: args.ts ?? ",",
        delimitThousandths: args.tsr ?? true,
        min: args.min ?? -5000,
        max: args.max ?? 5000,
        count: args.count ?? 500,
        precision: args.precision ?? 8,
        fixedDecimals: args.fixed ?? 8
    }
    let outFormat = {
        format: args.format ?? "array",
        minified: args.minified ?? true,
        callback: args.callback ?? (() => { })
    }
    if (verbose) console.log(format, outFormat);
    let nums = Array.from({ length: format.count }, () => getNum(format.min, format.max, format.precision));
    if (verbose) console.log(nums.slice(0,5));
    nums = nums.map(num => num.toFixed(format.fixedDecimals));
    if (verbose) console.log(nums.slice(0,5));
    nums = nums.map(num => num.replace(".", format.decimalDelimiter));
    if (verbose) console.log(nums.slice(0,5));
    nums = nums.map(num => addSeparator(num, format.thousandsDelimiter, format.delimitThousandths));
    if (verbose) console.log(nums.slice(0,5));
    nums = nums.map(num => '"' + num + '"');
    if (verbose) console.log(nums.slice(0,5));

    let joinBy = outFormat.minified ? "," : ",\r\n";
    let text = "[" + nums.join(joinBy) + "]\r\n";

    fs.appendFile(path.resolve(__dirname, 'generator.out.txt'), text, outFormat.callback);
}

const writeSetsNew = (args) => {
    let minnum = args.min ?? -50000;
    let maxnum = args.max ?? 200000;
    let mincount = args.minc ?? 50;
    let maxcount = args.maxc ?? 500;
    let decseps = args.ds ?? [".",","];
    let thoseps = args.ts ?? [",","_","."];
    
    let min = rand.gauss(minnum, maxnum);
    let max = rand.gauss(min, maxnum);
    let count = rand.int(mincount, maxcount);

}

const writeSets = (args) => {
    let amin = -50000;
    let amid = 50000;
    let amax = 200000;
    let countrange = [200, 1000];
    let dds = [".", ","];
    let tds = [",", " ", "_"];
    let tdsu = tds.filter(d => !dds.includes(d));
    let precisionRange = [0,12];
    let fixedRange= [0,16];

    function getNext(count) {
        if (count === 0) return;
        let min = [amin, amid].between();
        let max = [min, amax].between();
        let fixed = fixedRange.random();
        let args = {
            min: min,
            max: max,
            ds: dds.random(),
            ts: tds.random(),
            tsr: fixed === 0,
            count: countrange.random(),
            precision: precisionRange.random(),
            fixed: fixed,
            callback: (() => getNext(count - 1))
        }
        if (args.ds === args.ts)
            args.ts = tdsu.random();

        writeSet(args);
    }

    fs.unlink(path.resolve(__dirname, 'generator.out.txt'), () => {
        getNext(args.count);
    });
}

writeSets({count:10});