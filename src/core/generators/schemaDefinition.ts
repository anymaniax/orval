import isEmpty from 'lodash/isEmpty';
import { SchemasObject } from 'openapi3-ts';
import { ContextSpecs } from '../../types';
import { GeneratorSchema } from '../../types/generator';
import { asyncReduce } from '../../utils/async-reduce';
import { pascal } from '../../utils/case';
import { isReference } from '../../utils/is';
import { getSpecName } from '../../utils/path';
import { getEnum } from '../getters/enum';
import { resolveValue } from '../resolvers/value';
import { generateInterface } from './interface';

/**
 * Extract all types from #/components/schemas
 *
 * @param schemas
 */
export const generateSchemasDefinition = async (
  schemas: SchemasObject = {},
  context: ContextSpecs,
): Promise<GeneratorSchema[]> => {
  if (isEmpty(schemas)) {
    return [];
  }

  const models = asyncReduce(
    Object.entries(schemas),
    async (acc, [name, schema]) => {
      if (
        (!schema.type || schema.type === 'object') &&
        !schema.allOf &&
        !schema.oneOf &&
        !isReference(schema) &&
        !schema.nullable
      ) {
        return [
          ...acc,
          ...(await generateInterface({ name, schema, context })),
        ];
      } else {
        const resolvedValue = await resolveValue({
          schema,
          name,
          context,
        });

        let output = '';

        const schemaName = pascal(name);
        let imports = resolvedValue.imports;

        if (resolvedValue.isEnum && !resolvedValue.ref) {
          output += getEnum(
            resolvedValue.value,
            resolvedValue.type,
            schemaName,
          );
        } else if (schemaName === resolvedValue.value && resolvedValue.ref) {
          const imp = resolvedValue.imports.find(
            (imp) => imp.name === schemaName,
          );

          if (!imp) {
            output += `export type ${schemaName} = ${resolvedValue.value};\n`;
          } else {
            const alias = imp?.specKey
              ? `${pascal(getSpecName(imp.specKey, context.specKey))}${
                  resolvedValue.value
                }`
              : `${resolvedValue.value}Bis`;

            output += `export type ${schemaName} = ${alias};\n`;

            imports = imports.map((imp) =>
              imp.name === schemaName ? { ...imp, alias } : imp,
            );
          }
        } else {
          output += `export type ${schemaName} = ${resolvedValue.value};\n`;
        }

        return [
          ...acc,
          ...resolvedValue.schemas,
          {
            name: schemaName,
            model: output,
            imports,
          },
        ];
      }
    },
    [] as GeneratorSchema[],
  );

  return models;
};
