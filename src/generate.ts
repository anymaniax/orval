import { dirname } from 'upath';
import { importSpecs } from './core/importers/specs';
import { writeSpecs } from './core/writers/specs';
import { ExternalConfigFile, Options } from './types';
import { catchError } from './utils/errors';
import { loadFile } from './utils/file';

export const generateSpec = async (
  workspace: string,
  options: Options,
  projectName?: string,
) => {
  try {
    const writeSpecProps = await importSpecs(workspace, options);
    await writeSpecs(writeSpecProps, workspace, options, projectName);
  } catch (e) {
    catchError(e);
  }
};

export const generateConfig = async (
  configFile?: string,
  projectName?: string,
) => {
  const { path, file: config } = await loadFile<ExternalConfigFile>(
    configFile,
    {
      defaultFileName: 'orval.config',
    },
  );

  const workspace = dirname(path);

  if (projectName) {
    const project = config[projectName];

    if (project) {
      generateSpec(workspace, project, projectName);
    } else {
      catchError('Project not found');
    }
    return;
  }

  return Promise.all(
    Object.entries(config).map(([projectName, options]) =>
      generateSpec(workspace, options, projectName),
    ),
  );
};
