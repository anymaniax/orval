/**
 * Generated by orval v6.7.1 🍺
 * Do not edit manually.
 * Swagger Petstore
 * OpenAPI spec version: 1.0.0
 */
import type { Pets, ListPetsParams, CreatePetsBody, Pet } from '../model';
import { customInstance } from '../mutator/custom-instance';

/**
 * @summary List all pets
 */
export const listPets = (
  params?: ListPetsParams,
  version = 1,
  signal?: AbortSignal,
) => {
  return customInstance<Pets>({
    url: `/v${version}/pets`,
    method: 'get',
    signal,
    params,
  });
};

/**
 * @summary Create a pet
 */
export const createPets = (createPetsBody: CreatePetsBody, version = 1) => {
  return customInstance<void>({
    url: `/v${version}/pets`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: createPetsBody,
  });
};

/**
 * @summary Info for a specific pet
 */
export const showPetById = (
  petId: string,
  version = 1,
  signal?: AbortSignal,
) => {
  return customInstance<Pet>({
    url: `/v${version}/pets/${petId}`,
    method: 'get',
    signal,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

export type ListPetsResult = NonNullable<AsyncReturnType<typeof listPets>>;
export type CreatePetsResult = NonNullable<AsyncReturnType<typeof createPets>>;
export type ShowPetByIdResult = NonNullable<
  AsyncReturnType<typeof showPetById>
>;
