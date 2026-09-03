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
 import type { ChangeEvent, ReactNode } from 'react';
 import {
   and,
   isStringControl,
   rankWith,
   schemaMatches,
   uiTypeIs,
 } from '@jsonforms/core';
 import type { ControlProps } from '@jsonforms/core';
 import { withJsonFormsControlProps } from '@jsonforms/react';
 import {
   vanillaCells,
   vanillaRenderers,
 } from '@jsonforms/vanilla-renderers';
 import {
   Checkbox,
   FormItem,
   Input,
   InputNumber,
   Select,
 } from '@superset-ui/core/components';
 
 type InputOptions = {
   inputProps?: Record<string, unknown>;
   placeholderText?: string;
   tooltip?: string;
   type?: string;
 };
 
 /**
  * Builds common FormItem properties from the JSON Forms control contract.
  */
 function getFormItemProps(props: ControlProps) {
   const options = (props.uischema.options ?? {}) as InputOptions;
 
   return {
     label: props.label,
     tooltip: options.tooltip,
     required: props.required,
     help: props.errors || undefined,
     validateStatus: props.errors ? ('error' as const) : undefined,
   };
 }
 
 /**
  * Reads renderer options while keeping arbitrary JSON Forms input options local.
  */
 function getInputOptions(props: ControlProps): InputOptions {
   return (props.uischema.options ?? {}) as InputOptions;
 }
 
 /**
  * Renders schema-driven strings and is reused by semantic custom controls.
  *
  * Custom controls may set `options.type` to `password` or pass `enabled: false`
  * while retaining the same label, error, and change-propagation behavior.
  */
 // PUBLIC_INTERFACE
 export function TextControl(props: ControlProps) {
   if (!props.visible) {
     return null;
   }
 
   const options = getInputOptions(props);
   const inputProps = options.inputProps ?? {};
   const inputType = options.type ?? 'text';
   const value =
     props.data === null || props.data === undefined ? '' : String(props.data);
 
   return (
     <FormItem {...getFormItemProps(props)}>
       {inputType === 'password' ? (
         <Input.Password
           id={props.id}
           aria-label={props.label || undefined}
           value={value}
           disabled={!props.enabled}
           placeholder={options.placeholderText}
           onChange={(event: ChangeEvent<HTMLInputElement>) =>
             props.handleChange(props.path, event.target.value)
           }
           {...inputProps}
         />
       ) : (
         <Input
           id={props.id}
           aria-label={props.label || undefined}
           type={inputType}
           value={value}
           disabled={!props.enabled}
           placeholder={options.placeholderText}
           onChange={(event: ChangeEvent<HTMLInputElement>) =>
             props.handleChange(props.path, event.target.value)
           }
           {...inputProps}
         />
       )}
     </FormItem>
   );
 }
 
 function NumberControl(props: ControlProps) {
   if (!props.visible) {
     return null;
   }
 
   const options = getInputOptions(props);
 
   return (
     <FormItem {...getFormItemProps(props)}>
       <InputNumber
         id={props.id}
         aria-label={props.label || undefined}
         value={typeof props.data === 'number' ? props.data : null}
         disabled={!props.enabled}
         placeholder={options.placeholderText}
         style={{ width: '100%' }}
         onChange={value => props.handleChange(props.path, value)}
       />
     </FormItem>
   );
 }
 
 function BooleanControl(props: ControlProps) {
   if (!props.visible) {
     return null;
   }
 
   return (
     <FormItem {...getFormItemProps(props)} valuePropName="checked">
       <Checkbox
         id={props.id}
         aria-label={props.label || undefined}
         checked={props.data === true}
         disabled={!props.enabled}
         onChange={event => props.handleChange(props.path, event.target.checked)}
       >
         {props.label}
       </Checkbox>
     </FormItem>
   );
 }
 
 function EnumControl(props: ControlProps) {
   if (!props.visible) {
     return null;
   }
 
   const options = getInputOptions(props);
   const schema = props.schema as Record<string, unknown>;
   const enumValues = Array.isArray(schema.enum) ? schema.enum : [];
   const enumNames = Array.isArray(schema['x-enumNames'])
     ? schema['x-enumNames']
     : [];
 
   return (
     <FormItem {...getFormItemProps(props)}>
       <Select
         id={props.id}
         ariaLabel={props.label || undefined}
         value={(props.data as string | number | undefined) ?? undefined}
         disabled={!props.enabled}
         allowClear
         placeholder={options.placeholderText}
         options={enumValues.map((value, index) => ({
           value: value as string | number,
           label: String(enumNames[index] ?? value),
         }))}
         onChange={value => props.handleChange(props.path, value)}
       />
     </FormItem>
   );
 }
 
 const TextRenderer = withJsonFormsControlProps(TextControl);
 const NumberRenderer = withJsonFormsControlProps(NumberControl);
 const BooleanRenderer = withJsonFormsControlProps(BooleanControl);
 const EnumRenderer = withJsonFormsControlProps(EnumControl);
 
 const controlTester = uiTypeIs('Control');
 const scalarEnumEntry = {
   tester: rankWith(
    // Scalar enums must beat the generic text renderer (rank 2), while
    // remaining below semantic specializations such as password (rank 3).
    2.5,
     and(
       controlTester,
       schemaMatches(schema => {
         const enumValues = (schema as Record<string, unknown>)?.enum;
         return Array.isArray(enumValues) && enumValues.length > 0;
       }),
       schemaMatches(schema => (schema as Record<string, unknown>)?.type !== 'array'),
     ),
   ),
   renderer: EnumRenderer,
 };
 const numberEntry = {
   tester: rankWith(
     2,
     and(
       controlTester,
       schemaMatches(schema => {
         const type = (schema as Record<string, unknown>)?.type;
         return type === 'number' || type === 'integer';
       }),
     ),
   ),
   renderer: NumberRenderer,
 };
 const booleanEntry = {
   tester: rankWith(
     2,
     and(
       controlTester,
       schemaMatches(
         schema => (schema as Record<string, unknown>)?.type === 'boolean',
       ),
     ),
   ),
   renderer: BooleanRenderer,
 };
 const textEntry = {
  // Rank above the vanilla string renderer so semantic forms consistently
  // use the Ant Design-compatible TextControl. Specialized semantic controls
  // retain their higher ranks in jsonFormsHelpers.tsx.
  tester: rankWith(2, and(controlTester, isStringControl)),
   renderer: TextRenderer,
 };
 
 /**
  * Renderer entries for semantic-layer and semantic-view JSON Forms.
  *
  * Superset controls take precedence over the vanilla fallback entries while
  * retaining fallback support for object and non-enum array schemas. Feature
  * custom renderers declare higher ranks in jsonFormsHelpers.tsx.
  */
 // PUBLIC_INTERFACE
 export const rendererRegistryEntries = [
   ...vanillaRenderers,
   textEntry,
   numberEntry,
   booleanEntry,
   scalarEnumEntry,
 ];
 
 /**
  * Cell entries supplied with the local renderer registry.
  *
  * Semantic controls do not delegate to cells, but retaining vanilla cells
  * preserves JSON Forms behavior for any fallback renderer that does.
  */
 // PUBLIC_INTERFACE
 export const cellRegistryEntries = vanillaCells;
