import { GeneratorSchema } from '../../types/generator';
import {
  GetterBody,
  GetterParams,
  GetterProps,
  GetterPropType,
} from '../../types/getters';
import { sortByPriority } from '../../utils/sort';

export const getProps = ({
  body,
  queryParams,
  params,
}: {
  body: GetterBody;
  queryParams?: GeneratorSchema;
  params: GetterParams;
}): GetterProps => {
  const bodyProp = {
    name: body.implementation,
    definition: `${body.implementation}: ${body.definition}`,
    implementation: `${body.implementation}: ${body.definition}`,
    default: false,
    required: true,
    type: GetterPropType.BODY,
  };

  const queryParamsProp = {
    name: 'params',
    definition: `params?: ${queryParams?.name}`,
    implementation: `params?: ${queryParams?.name}`,
    default: false,
    required: false,
    type: GetterPropType.QUERY_PARAM,
  };

  const props = [
    ...params.map((param) => ({ ...param, type: GetterPropType.PARAM })),
    ...(body.definition ? [bodyProp] : []),
    ...(queryParams ? [queryParamsProp] : []),
  ];

  const sortedProps = sortByPriority(props);

  return sortedProps;
};
