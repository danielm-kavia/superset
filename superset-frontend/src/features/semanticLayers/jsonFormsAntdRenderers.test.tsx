/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  fireEvent,
  render,
  screen,
  selectOption,
  userEvent,
  waitFor,
} from 'spec/helpers/testing-library';
import { JsonForms } from '@jsonforms/react';
import type { JsonSchema } from '@jsonforms/core';
import { renderers, buildUiSchema, sanitizeSchema } from './jsonFormsHelpers';
import { cellRegistryEntries } from './jsonFormsRenderers';

/**
 * Real-render smoke test for the local semantic JSON Forms registry.
 *
 * SemanticLayerModal tests mock <JsonForms /> away, leaving this as direct
 * coverage that the local controls mount against Ant Design 6 wrappers.
 * It renders exactly as the modal does: with the same renderer registry,
 * cell registry, and UI-schema builder.
 */
const schema = sanitizeSchema({
  type: 'object',
  properties: {
    account: {
      type: 'string',
      title: 'Account',
    },
    warehouse: {
      type: 'string',
      title: 'Warehouse',
      enum: ['wh_small', 'wh_large'],
    },
    use_ssl: {
      type: 'boolean',
      title: 'Use SSL',
    },
    port: {
      type: 'number',
      title: 'Port',
    },
    service_token: {
      type: 'string',
      title: 'Service token',
      format: 'password',
    },
    locked_database: {
      type: 'string',
      title: 'Locked database',
      default: 'analytics',
      readOnly: true,
    },
    dynamic_host: {
      type: 'string',
      title: 'Dynamic host',
      'x-dynamic': true,
      'x-dependsOn': ['account'],
    },
  },
  required: ['account'],
} as JsonSchema);

const setup = (data: Record<string, unknown> = {}) => {
  const onChange = jest.fn();
  render(
    <JsonForms
      schema={schema}
      uischema={buildUiSchema(schema)}
      data={data}
      renderers={renderers}
      cells={cellRegistryEntries}
      validationMode="ValidateAndHide"
      onChange={onChange}
    />,
  );
  return onChange;
};

test('renders string, enum, boolean, and number controls from a schema', () => {
  setup();

  // String + number render as real inputs with their schema titles as labels.
  expect(screen.getByLabelText('Account')).toBeInTheDocument();
  expect(screen.getByLabelText('Port')).toBeInTheDocument();
  // Enum renders as an Ant Design Select.
  expect(screen.getByRole('combobox', { name: 'Warehouse' })).toBeVisible();
  // Boolean renders with its title.
  expect(screen.getByText('Use SSL')).toBeInTheDocument();
});

test('typing into a text control propagates through onChange', async () => {
  const onChange = setup();

  const input = screen.getByLabelText('Account');
  await userEvent.type(input, 'acme');
  fireEvent.blur(input);

  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ account: 'acme' }),
      }),
    ),
  );
});

test('enum control opens an antd 6 dropdown and selects an option', async () => {
  const onChange = setup();

  await selectOption('wh_large', 'Warehouse');

  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ warehouse: 'wh_large' }),
      }),
    ),
  );
});

test('uses local TextControl behavior for password, read-only, and dynamic fields', () => {
  setup({ account: 'acme' });

  expect(screen.getByLabelText('Service token')).toHaveAttribute(
    'type',
    'password',
  );
  expect(screen.getByLabelText('Locked database')).toBeDisabled();
  expect(screen.getByLabelText('Dynamic host')).toBeEnabled();
});
