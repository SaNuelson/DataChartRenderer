import { Number } from '../usetype.js';

test('number usetype to string, simple', () => {
    const nu = new Number({
        min: -12000,
        max: 6500
    })
    expect(nu.toString()).toBe("{[-12000][6500]}");
});

test('number usetype to string, price', () => {
    const nu = new Number({
        min: 0,
        max: 50000,
        decimalPlaces: 2,
        prefix: "$",
        suffix: "(incl.tax.)(excl.tax.)"
    })
    expect(nu.toString()).toBe("{[$0.00(incl.tax.)(excl.tax.)][$50000.00(incl.tax.)(excl.tax.)]}")
});

test('number usetype to string, implicit decimal places', () => {
    const nu = new Number({
        min: -20.358,
        max: 30.25
    })
    expect(nu.toString()).toBe("{[-20.358][30.250]}")
})

test('number usetype to string, thousand separators', () => {
    const nu = new Number({
        min: 10000,
        max: 3550000,
        thousandSeparator: " "
    })
    expect(nu.toString()).toBe("{[10 000][3 550 000]}")
})

test('number usetype to string, all params', () => {
    const nu = new Number({
        min: -5555.5555,
        max: 77777.777,
        decimalPlaces: 5,
        prefix: "p",
        suffix: "s",
        decimalSeparator: ".",
        thousandSeparator: ","
    })
    expect(nu.toString()).toBe("{[p-5,555.555,50s][p77,777.777,00s]}")
})