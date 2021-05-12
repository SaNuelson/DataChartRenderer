Issues
===

#### Usetype validity, accuracy & confidence

##### Validity

Usetype is considered valid if it captures the format which was intended for provided data.
It's not expected for a valid usetype to flawlessly define the captured data. The data can contain blank entries, values specifying blank entries or typos.
Another possibility are mixed data (e.g. skipped date instead of datetime, where time is unknown), TODO.

Therefore a question arises, how to check whether a usetype (that is a format specifier) is valid?
Moreover, is there a way to determine validity during the checking process? In such case our parsing time could be decreased significantly, as we would not need to check the whole column.

This term most likely strongly depends on the concepts of precision and confidence. That is, if a specific format has a high accuracy (high ratio of parsable values) and high confidence (high possibility of it being the most fitting usetype), it can be prematurely labelled as the correct one, and the parsing process can be halted.

##### Accuracy

A rather simple concept. We define the accuracy of a usetype as:

acc(usetype) = # well parsed entries / # all entries

Here, the first and most important question would be, what is the best required accuracy for a usetype?
We can exclude the blank entries as well as NOVAL entries by pre-processing the data and filtering out any such values.
This means that, provided we're holding a gold usetype, and we don't take the possibility of mixed data into account, the only wrongly parsed values will be ones which contain a typo.