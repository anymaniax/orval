import chalk from 'chalk';
import { GeneratorMutator } from '../..';
import { NormalizedMutator } from '../../types';
import { getFileInfo, loadFile } from '../../utils/file';
import { createLogger } from '../../utils/messages/logs';
import { relativeSafe } from '../../utils/path';

const getImport = (output: string, mutator: NormalizedMutator) => {
  const outputFileInfo = getFileInfo(output);
  const mutatorFileInfo = getFileInfo(mutator.path);
  const { pathWithoutExtension } = getFileInfo(
    relativeSafe(outputFileInfo.dirname, mutatorFileInfo.path),
  );

  return pathWithoutExtension;
};

export const generateMutator = async ({
  output,
  mutator,
  name,
  workspace,
}: {
  output?: string;
  mutator?: NormalizedMutator;
  name: string;
  workspace: string;
}): Promise<GeneratorMutator | undefined> => {
  if (!mutator || !output) {
    return;
  }
  const isDefault = mutator.default;
  const importName = mutator.name ? mutator.name : `${name}Mutator`;
  const importPath = mutator.path;

  try {
    const { file } = await loadFile<Record<string, Function>>(importPath, {
      isDefault: false,
      root: workspace,
      alias: mutator.alias,
    });

    const mutatorFn =
      file[mutator.default || !mutator.name ? 'default' : mutator.name];

    if (!mutatorFn) {
      createLogger().error(
        chalk.red(
          `Your mutator file doesn't have the ${
            mutator.default ? 'default' : mutator.name
          } exported function`,
        ),
      );
      process.exit(1);
    }

    const path = getImport(output, mutator);

    return { name: importName, path, default: isDefault, mutatorFn };
  } catch (e) {
    const path = getImport(output, mutator);

    createLogger().warn(
      chalk.yellow(
        'Your mutator cannot be loaded so default setup has been applied',
      ),
    );

    return {
      name: importName,
      path,
      default: isDefault,
      mutatorFn: () => undefined,
    };
  }
};
