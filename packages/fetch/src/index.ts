import {
  camel,
  ClientBuilder,
  ClientDependenciesBuilder,
  ClientGeneratorsBuilder,
  generateFormDataAndUrlEncodedFunction,
  generateVerbImports,
  GeneratorDependency,
  GeneratorOptions,
  GeneratorVerbOptions,
  GetterPropType,
  stringify,
  toObjectString,
  generateBodyOptions,
  isObject,
} from '@orval/core';

const PARAMS_SERIALIZER_DEPENDENCIES: GeneratorDependency[] = [
  {
    exports: [
      {
        name: 'qs',
        default: true,
        values: true,
        syntheticDefaultImport: true,
      },
    ],
    dependency: 'qs',
  },
];

export const getDependencies: ClientDependenciesBuilder = (
  hasParamsSerializerOptions: boolean,
) => [...(hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : [])];

const generateRequestFunction = (
  {
    queryParams,
    operationName,
    response,
    body,
    props,
    verb,
    formData,
    formUrlEncoded,
    override,
  }: GeneratorVerbOptions,
  { route }: GeneratorOptions,
) => {
  const isRequestOptions = override?.requestOptions !== false;
  const isFormData = override?.formData !== false;
  const isFormUrlEncoded = override?.formUrlEncoded !== false;

  const getUrlFnName = camel(`get-${operationName}-url`);
  const getUrlFnProps = toObjectString(
    props.filter(
      (prop) =>
        prop.type === GetterPropType.PARAM ||
        prop.type === GetterPropType.NAMED_PATH_PARAMS ||
        prop.type === GetterPropType.QUERY_PARAM,
    ),
    'implementation',
  );
  const getUrlFnImplementation = `export const ${getUrlFnName} = (${getUrlFnProps}) => {
${
  queryParams
    ? `
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      normalizedParams.append(key, value.toString());
    }
  });`
    : ''
}

  return \`${route}${queryParams ? '?${new URLSearchParams(normalizedParams).toString()}' : ''}\`
}\n`;
  const getUrlFnProperties = props
    .filter(
      (prop) =>
        prop.type === GetterPropType.PARAM ||
        prop.type === GetterPropType.QUERY_PARAM ||
        prop.type === GetterPropType.NAMED_PATH_PARAMS,
    )
    .map((param) => {
      if (param.type === GetterPropType.NAMED_PATH_PARAMS) {
        return param.destructured;
      } else {
        return param.name;
      }
    })
    .join(',');

  const args = `${toObjectString(props, 'implementation')} ${isRequestOptions ? `options?: RequestInit` : ''}`;
  const retrunType = `Promise<${response.definition.success || 'unknown'}>`;

  const globalFetchOptions = isObject(override?.requestOptions)
    ? `${stringify(override?.requestOptions)?.slice(1, -1)?.trim()}`
    : '';
  const fetchMethodOption = `method: '${verb.toUpperCase()}'`;

  const requestBodyParams = generateBodyOptions(
    body,
    isFormData,
    isFormUrlEncoded,
  );
  const fetchBodyOption = requestBodyParams
    ? `body: JSON.stringify(${requestBodyParams})`
    : '';

  const fetchResponseImplementation = `const res = await fetch(
    ${getUrlFnName}(${getUrlFnProperties}),
    {${globalFetchOptions ? '\n' : ''}      ${globalFetchOptions}
      ${isRequestOptions ? '...options,' : ''}
      ${fetchMethodOption}${fetchBodyOption ? ',' : ''}
      ${fetchBodyOption}
    }
  )
  
  return res.json()
`;

  const bodyForm = generateFormDataAndUrlEncodedFunction({
    formData,
    formUrlEncoded,
    body,
    isFormData,
    isFormUrlEncoded,
  });

  const fetchImplementationBody =
    `${bodyForm ? `  ${bodyForm}\n` : ''}` + `  ${fetchResponseImplementation}`;
  const fetchImplementation = `export const ${operationName} = async (${args}): ${retrunType} => {\n${fetchImplementationBody}}`;

  const implementation =
    `${getUrlFnImplementation}\n` + `${fetchImplementation}\n`;

  return implementation;
};

export const generateClient: ClientBuilder = (verbOptions, options) => {
  const imports = generateVerbImports(verbOptions);
  const functionImplementation = generateRequestFunction(verbOptions, options);

  return {
    implementation: `${functionImplementation}\n`,
    imports,
  };
};

const fetchClientBuilder: ClientGeneratorsBuilder = {
  client: generateClient,
  dependencies: getDependencies,
};

export const builder = () => () => fetchClientBuilder;

export default builder;
