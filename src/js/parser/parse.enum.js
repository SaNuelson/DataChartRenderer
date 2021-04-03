export function recognizeEnumset(source) {
	if (!source || source.length === 0)
		return [];

	
	var counts = {};
	var max = 0;
	var maxval = "";
	for (var i = 0; i < source.length; i++) {
		let temp = counts[source[i]] || 0;
		counts[source[i]] = 1 + temp;
		if (max < temp) {
			maxval = source[i];
			max = temp;
		}
	}

	var enumlike = 0;
	for (var i = 0; i < source.length; i++) {
		if (counts[source[i]] > 2)
			enumlike++;
	}

	// how much "binned" the data is
	var reductionFactor = 1 - Object.keys(counts).length / source.length;



	if (enumlike && reductionFactor > 0.5)
		return Object.keys(counts);
	if (!enumlike && reductionFactor > 0.2)
		return [maxval];
	return [];
}
