/**
 * @file Contains function which lookup string values in all kinds of constant (country names and codes, currencies...)
 * @todo locales
 */

const fetchList = [
    {
        name: 'countries',
        url: 'https://gist.githubusercontent.com/keeguon/2310008/raw/bdc2ce1c1e3f28f9cab5b4393c7549f38361be4e/countries.json'
    },
    {
        name: 'currencies',
        url: 'https://gist.githubusercontent.com/Fluidbyte/2973986/raw/8bb35718d0c90fdacb388961c98b8d56abc392c9/Common-Currency.json'
    }
]

const dataWrapper = {}
