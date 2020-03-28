import {OpenAPIObject, SchemaObject} from 'openapi3-ts';
import {generalJSTypesWithArray} from '../../constants';
import {MockOptions, OverrideOutput} from '../../types';
import {
  GeneratorVerbOptions,
  GeneratorVerbsOptions
} from '../../types/generator';
import {GetterResponse} from '../../types/getters';
import {stringify} from '../../utils/stringify';
import {getMockScalar} from '../getters/getMockScalar';

const getMockPropertiesWithoutFunc = (properties: any, specs: OpenAPIObject) =>
  Object.entries(
    typeof properties === 'function' ? properties(specs) : properties
  ).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]:
        typeof value === 'function'
          ? `(${value})()`
          : stringify(value as string)
    }),
    {}
  );

const getMockWithoutFunc = (
  specs: OpenAPIObject,
  override?: OverrideOutput
): MockOptions => ({
  ...(override?.mock?.properties
    ? {
        properties: getMockPropertiesWithoutFunc(
          override.mock.properties,
          specs
        )
      }
    : {}),
  ...(override?.operations
    ? {
        operations: Object.entries(override.operations).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value.mock?.properties
              ? {
                  properties: getMockPropertiesWithoutFunc(
                    value.mock.properties,
                    specs
                  )
                }
              : {}
          }),
          {}
        )
      }
    : {})
});

const toAxiosPromiseMock = (value: unknown, definition: string) =>
  `Promise.resolve(${value}).then(data => ({data})) as AxiosPromise<${definition}>`;

const getResponsesMockDefinition = (
  operationId: string,
  response: GetterResponse,
  schemas: {
    [key: string]: SchemaObject;
  },
  mockOptionsWithoutFunc: {[key: string]: unknown}
) => {
  return response.types.reduce(
    (acc, {value: type}) => {
      if (!type || generalJSTypesWithArray.includes(type)) {
        acc.definitions = [
          ...acc.definitions,
          toAxiosPromiseMock(undefined, response.definition)
        ];
        return acc;
      }

      const schema = {name: type, ...schemas[type]};
      if (!schema) {
        return acc;
      }

      const {value, imports} = getMockScalar({
        item: schema,
        schemas,
        mockOptions: mockOptionsWithoutFunc,
        operationId
      });

      acc.imports = [...acc.imports, ...imports];
      acc.definitions = [
        ...acc.definitions,
        toAxiosPromiseMock(value, response.definition)
      ];

      return acc;
    },
    {
      definitions: [] as string[],
      imports: [] as string[]
    }
  );
};

const getMockDefinition = (
  operationId: string,
  response: GetterResponse,
  specs: OpenAPIObject,
  override?: OverrideOutput
) => {
  const schemas = Object.entries(specs.components?.schemas || []).reduce(
    (acc, [name, type]) => ({...acc, [name]: type}),
    {}
  ) as {[key: string]: SchemaObject};

  const mockOptionsWithoutFunc = getMockWithoutFunc(specs, override);

  const {definitions, imports} = getResponsesMockDefinition(
    operationId,
    response,
    schemas,
    mockOptionsWithoutFunc
  );

  return {
    definition: '[' + definitions.join(', ') + ']',
    definitions,
    imports
  };
};

const getMockOptionsDataOverride = (
  operationId: string,
  override?: OverrideOutput
) => {
  const responseOverride = override?.operations?.[operationId]?.mock?.data;
  return typeof responseOverride === 'function'
    ? `(${responseOverride})()`
    : stringify(responseOverride);
};

const generateMockImplementation = (
  {operationId, response, definitionName, props}: GeneratorVerbOptions,
  specs: OpenAPIObject,
  override?: OverrideOutput
) => {
  const {definition, definitions, imports} = getMockDefinition(
    operationId,
    response,
    specs,
    override
  );

  const mockData = getMockOptionsDataOverride(operationId, override);

  const implementation = `  ${definitionName}(${
    props.definition
  }): AxiosPromise<${response.definition}> {
    return ${
      mockData
        ? toAxiosPromiseMock(mockData, response.definition)
        : definitions.length > 1
        ? `faker.helpers.randomize(${definition})`
        : definitions[0]
    }
  },
`;

  return {implementation, imports};
};

export const generateMocks = (
  verbsOptions: GeneratorVerbsOptions,
  specs: OpenAPIObject,
  override?: OverrideOutput
) => {
  return verbsOptions.reduce(
    (acc, verbOption) => {
      const {implementation, imports} = generateMockImplementation(
        verbOption,
        specs,
        override
      );
      acc.implementation += implementation;
      acc.imports = [...acc.imports, ...imports];
      return acc;
    },
    {
      implementation: '',
      imports: [] as string[]
    }
  );
};
