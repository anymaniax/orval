import program from 'commander';
import difference from 'lodash/difference';
import {join} from 'path';
import {importSpecs} from '../core/importers/importSpecs';
import {writeSpecs} from '../core/writers/writeSpecs';
import {ExternalConfigFile, Options} from '../types';
import {errorMessage, mismatchArgsMessage} from '../utils/messages/logs';

program.option('-o, --output [value]', 'output file destination');
program.option('-t, --types [value]', 'output types destination');
program.option('-d, --workDir [value]', 'directory destination');
program.option('-f, --file [value]', 'input file (yaml or json openapi specs)');
program.option(
  '-g, --github [value]',
  'github path (format: `owner:repo:branch:path`)'
);
program.option('-t, --transformer [value]', 'transformer function path');
program.option(
  '--validation',
  'add the validation step (provided by ibm-openapi-validator)'
);
program.option('--config [value]', 'override flags by a config file');
program.parse(process.argv);

const catchError = (err: string) => {
  errorMessage(err);
  process.exit(1);
}

if (program.config) {
  // Use config file as configuration (advanced usage)

  // tslint:disable-next-line: no-var-requires
  const config: ExternalConfigFile = require(join(
    process.cwd(),
    program.config
  ));

  const mismatchArgs = difference(program.args, Object.keys(config));
  if (mismatchArgs.length) {
    mismatchArgsMessage(mismatchArgs);
  }

  Object.entries(config)
    .filter(([backend]) =>
      program.args.length === 0 ? true : program.args.includes(backend)
    )
    .forEach(([backend, options]) => {
      importSpecs(options)
        .then(writeSpecs(options, backend))
        .catch(catchError);
    });
} else {
  // Use flags as configuration
  importSpecs((program as any) as Options)
    .then(writeSpecs((program as any) as Options))
    .catch(catchError);
}
