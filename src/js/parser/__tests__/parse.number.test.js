import { Number } from '../usetype.js';
import { recognizeNum } from '../parse.num.js';

describe('Number Usetype toString', () => {

    test('prints simple integer numbers', () => {
        const nu = new Number({
            min: -12000,
            max: 6500
        })
        expect(nu.toString()).toBe("{[-12000][6500]}");
    });

    test('prints prices (including affixes)', () => {
        const nu = new Number({
            min: 0,
            max: 50000,
            decimalPlaces: 2,
            prefix: "$",
            suffix: "(incl.tax.)(excl.tax.)"
        })
        expect(nu.toString()).toBe("{[$0.00(incl.tax.)(excl.tax.)][$50000.00(incl.tax.)(excl.tax.)]}")
    });

    test('prints decimal places described implicitly by values', () => {
        const nu = new Number({
            min: -20.358,
            max: 30.25
        })
        expect(nu.toString()).toBe("{[-20.358][30.250]}")
    })

    test('prints thousand separators correctly', () => {
        const nu = new Number({
            min: 10000,
            max: 3550000,
            thousandSeparator: " "
        })
        expect(nu.toString()).toBe("{[10 000][3 550 000]}")
    })

    test('prints a mix of all parameters', () => {
        const nu = new Number({
            min: -5555.5555,
            max: 77777.777,
            decimalPlaces: 5,
            prefix: "p",
            suffix: "s",
            decimalSeparator: ".",
            thousandSeparator: ","
        })
        expect(nu.toString()).toBe("{[p-5,555.55550s][p77,777.77700s]}")
    })
});