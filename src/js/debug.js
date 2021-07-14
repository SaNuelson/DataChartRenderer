import * as MainModule from './core/Main.js';

import * as ParseEnumModule from './parser/parse.enum.js';
import * as ParseMainModule from './parser/parse.main.js';
import * as ParseNumModule from './parser/parse.num.js';
import * as ParseTimestampModule from './parser/parse.timestamp.js';
import * as Usetype from './parser/usetype.js';

import * as MapperMainModule from './mapper/mapper.main.js';
import * as ChartJsIntegrationModule from './uigen/ChartJsIntegration.js';

import * as EventModule from './utils/events.js';
import * as LogicModule from './utils/logic.js';

import * as ConstantsModule from './parser/parse.constants.js';

window.debug = {
    core: {
        main: MainModule
    },
    parse: {
        enum: ParseEnumModule,
        main: ParseMainModule,
        num: ParseNumModule,
        timestamp: ParseTimestampModule,
        usetype: Usetype,
        constants: ConstantsModule
    },
    map: {
        main: MapperMainModule,
        chartjs: ChartJsIntegrationModule
    },
    utils: {
        events: EventModule,
        logic: LogicModule
    }
}