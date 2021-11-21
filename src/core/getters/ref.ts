import { ReferenceObject } from 'openapi3-ts';
import { resolve } from 'upath';
import url from 'url';
import { ContextSpecs } from '../../types';
import { pascal } from '../../utils/case';
import { getFileInfo } from '../../utils/file';
import { isUrl } from '../../utils/url';

type RefComponent = 'schemas' | 'responses' | 'parameters' | 'requestBodies';

const RefComponent = {
  schemas: 'schemas' as RefComponent,
  responses: 'responses' as RefComponent,
  parameters: 'parameters' as RefComponent,
  requestBodies: 'requestBodies' as RefComponent,
};

const REF_COMPONENTS = Object.values(RefComponent);

export const RefComponentSuffix: Record<RefComponent, string> = {
  schemas: '',
  responses: 'Response',
  parameters: 'Parameter',
  requestBodies: 'Body',
};

/**
 * Return the output type from the $ref
 *
 * @param $ref
 */
export const getRefInfo = async (
  $ref: ReferenceObject['$ref'],
  context: ContextSpecs,
): Promise<{
  name: string;
  originalName: string;
  type: RefComponent;
  specKey?: string;
}> => {
  const refComponent = REF_COMPONENTS.find((refComponent) =>
    $ref.includes(`#/components/${refComponent}`),
  );

  if (!refComponent) {
    throw new Error(`Unresolved $ref. Reference ${$ref} should use one of the following components [${REF_COMPONENTS.join(", ")}]`);
  }

  const suffix = context.override.components[refComponent].suffix;

  const refSplitted = $ref.split(`#/components/${refComponent}/`);

  if (!refSplitted[0]) {
    return {
      name: pascal(refSplitted[1]) + suffix,
      originalName: refSplitted[1],
      type: refComponent,
    };
  }

  const pathname = refSplitted[0];

  const path = isUrl(context.specKey)
    ? url.resolve(context.specKey, pathname)
    : resolve(getFileInfo(context.specKey).dirname, pathname);

  return {
    name: pascal(refSplitted[1]) + suffix,
    originalName: refSplitted[1],
    specKey: path,
    type: refComponent,
  };
};
