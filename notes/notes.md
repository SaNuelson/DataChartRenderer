Enum
===

#### What is?
Enum in the usual sense used in programming defines a fixed domain, usually consisting of numbers and/or strings.
Followingly, a variable can be defined as this enum, taking some value from its domain.
Such variable is (almost) always equal to one and only one of the values of the domain.
It can be changed, but again only within the domain.

Enums are used to hint a state of some finite state automata or its implementation.
They can also be used to define object's category within a preset domain.

As we're working with data in this specific case, we can expect for enums to signify categories.
It is good to note that the existence and recognization of enums can greatly improve the recognization process.
Should an enum be correctly recognized, it decreases the uncertainty of chart binding and may even hint at specific
charts which can utilize such enum (e.g. colors in buble chart).

So pretty straight-forward. We go through the elements, get set of uniques values and.... then what?

How do you tell if it's an enum if you know nada bout the dataset itself?

Possibilities:

 - Every key has to appear at least **k** times.
   - Estimatibility - good, decidability - bad.
   - There can be a dataset where some types just don't appear much.
   - Consider workplace employee roster, employer can be just 1 (or CEO, etc.)
   - In majority of cases, however, this might be a good hint, albeit not a deciding one.
     - **k** = 2
       - Safe estimation in vast majority of cases (except special cases such as mentioned CEO)
     - **k** = samples / domain / 2
       - Let's assume each category contains at least half of its expected amount in uniform distribution.
       - Thus we get P[n/2c <= X <= n/c] in binomial distribution, which we can approximate by a normal distribution
       - B(n,p) ~ N(np, sqrt(npq))
       - where n = # samples, p = 1/c, q = 1 - p
       - B(n,p) ~ N(n/c, sqrt(n(c-1)/c^2))
       - Next, we take CDF of normal distribution, and get approximation of our P above:
       - 
 - The number of samples has to be considerably larger than the number of uniques.
   - Estimatibility - great, decidability - good.
   - What is the best bound though? For large datasets it's natural to assume the domain doesn't grow in the same manner as does dataset size.
   - However, in smaller dataset it becomes much harder to find the sweetspot.
   - Should we try 


Current flow (as of 27.4.2021)
===

- Input & Storage
  - User loads raw data (CSV currently only supported)
  - Data is passed onto ChartManager instance.
  - ChartManager is responsible for working with GoogleCharts API.
  - ChartManager passes the data in turn on to SourceData instance
  - SourceData parses the data and holds essentially a table of string values
- Output & Rendering
  - When prompted, ChartManager requests SourceData's usetypes.
  - These, if not yet generated, are generated using the parser/recognizer submodule and cached afterwards.
  - P/R submodule supports several usetypes which have direct correlation with Google Charts required types
    - It consists of
      - Usetype interface
        - This interface creates the basis for different usetypes which are then recognized in data
        - EnumUsetype - handles enums, sets, booleans
        - NumberUsetype - handles number-like entities: prices, counts, fractions...
        - TimestampUsetype - handles timestamps of all kinds: date, datetime and timeofday
        - StringUsetype - used as a fallback usetype. If failed to be recognized, a data feature is considered to be a string.


TODO & Ideas
===

Several of current Chart templates use the same basis.
Maybe instead, let's keep only the bases as the core and add 'presets' key with array of possible configurations That would also give space for user to inject their custom configs as well.

Any parser pseudocode
===
```js

function recognizeUsetypes(data):

  initialSamples = data.take(INIT_BATCH_SIZE)
  otherSamples = data.skip(INIT_BATCH_SIZE)

  usetypes = recognizeInitialUsetypes(initialSamples)

  for (sample of otherSamples):
    
    for (usetype of usetypes):

      test = usetype.deformat(sample)

      if (typeof test === usetype.underlyingType):
        usetype.success++

  for (usetype of usetypes):

    if usetype.success < requiredPrecision * data.length:
      usetypes.remove(usetype)

    else
      usetype.confidence *= ustype.success / data.length

  return usetypes

```

Usetype to chart binding algo
===

```js
function findMappings(usetypeSets, chart) {
  
}
```