
/*

    PARSER SECTION - DATE/TIME

    Requirements:

        - expects almost correct input (with small mistakes)
        - expects uniform format throughout all data
    
    Possibilities:

        - can identify almost any pseudo-default date/datetime/time format
        - date is specified by:
            DAY (D/DD) [1-MONTH.DAYS]
            MONTH (M/MM) [1-12]
            YEAR (YY/YYYY) [no restrictions yet]
        - time is specified by:
            HOUR (h/hh) [0-11/23]
            MINUTE (m/mm) [0-59]
            SECOND (s/ss) [0-59]
            MILLISECOND (q/qq) [0-99] 

    Basic functioning:

        - upon first call, the function initializes date parsing.
            - this empties possible_date_formats which are later filled with possible FORMATs based on constraints while reading all inputs.
    
    
    FORMAT{

        count : int,
        order : byte[]

    }
        - for easier parsing, FORMAT is of type byte[], where indexes correspond to order in which date is written, and values correspond to specific parts of the date
            ( YEAR = 6, MONTH = 5, DAY = 4, HOUR = 3, MINUTE = 2, SECOND = 1, MILLISECOND = 0)
            [ eg. datetime format "DD.MM.YYYY hh:mm:ss:qq" is equivalent to [4,5,6,3,2,1,0] ]

    DELS{

        count : int,
        value : string[]

    }

*/

var is_date_init = false;
var date_del_regex = /[^0-9]/;
var date_num_regex = /[0-9]/;
var possible_date_formats = [] // FORMAT[]
var recorded_date_dels = [] // DELS[]

function init_date(){

    is_date_init = true;
    possible_date_formats.clear();
    recorded_date_dels.clear();

}

/**
 * @param {string} source_data Date in string format.
 * @returns {[string]} possible formats
 */
function find_datetime_pattern(source){

    if(!is_date_init)
        init_date();

    let data = source.split(date_del_regex);
    let dels = source.split(date_num_regex);

}