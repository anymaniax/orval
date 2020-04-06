import { pascal } from 'case';
import { SchemaObject } from 'openapi3-ts';
import { generalTypesFilter } from '../../utils/filters';
import { getScalar } from '../getters/scalar';

/**
 * Generate the interface string
 * A tslint comment is insert if the resulted object is empty
 *
 * @param name interface name
 * @param schema
 */
export const generateInterface = (name: string, schema: SchemaObject) => {
  const { value, imports, schemas } = getScalar(schema, name);
  const isEmptyObject = value === '{}';

  let model = isEmptyObject
    ? '// tslint:disable-next-line:no-empty-interface\n'
    : '';

  model += `export interface ${pascal(name)} ${value}\n`;

  return [
    ...schemas,
    {
      name: pascal(name),
      model,
      imports: generalTypesFilter(imports),
    },
  ];
};
