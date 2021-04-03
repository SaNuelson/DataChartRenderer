
//#region Unary

/**
 * Generate an unary NOT wrapper
 * @param {function (...any) : boolean} f 
 * @returns {function (...any) : boolean}
 */
export const ruleNot = f => ((...p) => !f(...p));

//#endregion

//#region Binary

/**
 * Generate a binary AND merger
 * @param {function (...any) : boolean} f
 * @param {function (...any) : boolean} g
 * @returns {function (...any) : boolean} f(...p) AND g(...p)
 */
export const ruleBoth = (f,g) => ((...p) => f(...p) && g(...p));

/**
 * Generate a binary OR merger
 * @param {function (...any) : boolean} f 
 * @param {function (...any) : boolean} g 
 * @returns {function (...any) : boolean} f(...p) OR g(...p)
 */
export const ruleEither = (f,g) => ((...p) => f(...p) || g(...p));

/**
 * Generate a binary IMPLIES (=>) merger
 * @param {function (...any) : boolean} f 
 * @param {function (...any) : boolean} g 
 * @returns {function (...any) : boolean} f(...p) => g(...p)
 */
 export const ruleImplies = (f,g) => ((...p) => !f(...p) || g(...p));

/**
 * Generate a binary IMPLIEDBY (<=) merger
 * @param {function (...any) : boolean} f 
 * @param {function (...any) : boolean} g 
 * @returns {function (...any) : boolean} f(...p) <= g(...p)
 */
 export const ruleImpliedBy = (f,g) => ((...p) => f(...p) || !g(...p));

/**
 * Generate a binary IFF (==) merger
 * @param {function (...any) : boolean} f 
 * @param {function (...any) : boolean} g 
 * @returns {function (...any) : boolean} f(...p) == g(...p)
 */
export const ruleIff = (f,g) => ((...p) => f(...p) === g(...p));

//#endregion

//#region Arbitrary

/**
 * Generate an ALL merger (strict)
 * @param {Array.<function (...any) : boolean>} fs 
 * @returns {function (...any) : boolean} for each f in fs: f(...p)
 */
export const ruleAll = (...fs) => ((...p) => fs.every(f => f(...p)));

/**
 * Generate an ANY merger (non-strict)
 * @param {Array.<function (...any) : boolean>} fs 
 * @returns {function (...any) : boolean} exists f in fs: f(...p)
 */
export const ruleAny = (...fs) => ((...p) => fs.some(f => f(...p)));

/**
 * Generate a NONE merger (non-strict)
 * @param {Array.<function (...any) : boolean>} fs 
 * @returns {function (...any) : boolean} for each f in fs: NOT f(...p)
 */
export const ruleNone = (...fs) => !ruleAny(...fs);

/**
 * Generate an NOT ALL merger
 * @param {Array.<function (...any) : boolean>} fs 
 * @returns {function (...any) : boolean} exists f in fs: NOT f(...p)
 */
export const ruleNotAll = (...fs) => !ruleAll(...fs);

/**
 * Generate an IFF merger
 * @param {Array.<function (...any) : boolean>} fs 
 * @returns {function (...any) : boolean} for each f,g in fs: f(...p) == g(...p)
 */
export const ruleEqual = (...fs) => ruleAny(ruleAll(...fs), ruleNone(...fs));

//#endregion