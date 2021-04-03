import * as ChartModule from './core/Chart.js';
import * as MainModule from './core/Main.js';
import * as RoleModule from './core/Role.js';
import * as SourceDataModule from './core/SourceData.js';
import * as TemplateModule from './core/Template.js';

import * as ParseEnumModule from './parser/parse.enum.js';
import * as ParseExperimentModule from './parser/parse.experiment.js';
import * as ParseMainModule from './parser/parse.main.js';
import * as ParseNumModule from './parser/parse.num.js';
import * as ParseTimestampModule from './parser/parse.timestamp.js';

import * as UigenMainModule from './uigen/Main.js';

import * as EventModule from './utils/events.js';
import * as LogicModule from './utils/logic.js';
import * as UtilsModule from './utils/utils.js';

window.debug = {
    core: {
        chart: ChartModule,
        main: MainModule,
        role: RoleModule,
        sourcedata: SourceDataModule,
        template: TemplateModule
    },
    parse: {
        enum: ParseEnumModule,
        experiment: ParseExperimentModule,
        main: ParseMainModule,
        num: ParseNumModule,
        timestamp: ParseTimestampModule
    },
    uigen: {
        main: UigenMainModule
    },
    utils: {
        events: EventModule,
        logic: LogicModule,
        utils: UtilsModule
    }
}