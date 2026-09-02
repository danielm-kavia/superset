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

import exploreReducer, { ExploreState } from './exploreReducer';
import { setStashFormData } from '../actions/exploreActions';
import { QueryFormData } from '@superset-ui/core';
import { Dataset } from '@superset-ui/chart-controls';
import * as actions from '../actions/exploreActions';

test('reset hiddenFormData on SET_STASH_FORM_DATA', () => {
  const initialState: ExploreState = {
    form_data: { a: 3, c: 4 } as unknown as QueryFormData,
    controls: {},
  };
  const action = setStashFormData(true, ['a', 'c']) as Parameters<
    typeof exploreReducer
  >[1];
  const newState = exploreReducer(initialState, action);
  expect(newState.form_data).toEqual({});
  expect(newState.hiddenFormData).toEqual({ a: 3, c: 4 });
  const restoreAction = setStashFormData(false, ['c']) as Parameters<
    typeof exploreReducer
  >[1];
  const newState2 = exploreReducer(newState, restoreAction);
  expect(newState2.form_data).toEqual({ c: 4 });
  expect(newState2.hiddenFormData).toEqual({ a: 3 });
});

test('restores the initial Explore chart configuration without resetting unrelated state', () => {
  const initialDatasource = {
    id: 1,
    type: 'table',
    uid: '1__table',
  } as Dataset;
  const state: ExploreState = {
    controls: {},
    datasource: {
      id: 2,
      type: 'table',
      uid: '2__table',
    } as Dataset,
    form_data: {
      datasource: '2__table',
      row_limit: 500,
      viz_type: 'table',
    } as QueryFormData,
    initialDatasource,
    initialFormData: {
      datasource: '1__table',
      row_limit: 100,
      viz_type: 'table',
    } as QueryFormData,
    hiddenFormData: { row_limit: 500 } as Partial<QueryFormData>,
    isStarred: true,
    chartStates: { 1: { state: { selected: 'value' } } },
  };

  const newState = exploreReducer(
    state,
    actions.resetExploreConfig() as Parameters<typeof exploreReducer>[1],
  );

  expect(newState.form_data).toEqual(state.initialFormData);
  expect(newState.datasource).toEqual(initialDatasource);
  expect(newState.hiddenFormData).toBeUndefined();
  expect(newState.controlsTransferred).toEqual([]);
  expect(newState.isStarred).toBe(true);
  expect(newState.chartStates).toBe(state.chartStates);
});

test('does not update Explore state when chart configuration already matches the initial snapshot', () => {
  const initialDatasource = {
    id: 1,
    type: 'table',
    uid: '1__table',
  } as Dataset;
  const initialFormData = {
    datasource: '1__table',
    row_limit: 100,
    viz_type: 'table',
  } as QueryFormData;
  const state: ExploreState = {
    controls: {},
    datasource: initialDatasource,
    form_data: initialFormData,
    initialDatasource,
    initialFormData,
  };

  const newState = exploreReducer(
    state,
    actions.resetExploreConfig() as Parameters<typeof exploreReducer>[1],
  );

  expect(newState).toBe(state);
});

test('skips updates when the field is already updated on SET_STASH_FORM_DATA', () => {
  const initialState: ExploreState = {
    form_data: { a: 3, c: 4 } as unknown as QueryFormData,
    hiddenFormData: { b: 2 } as unknown as Partial<QueryFormData>,
    controls: {},
  };
  const restoreAction = setStashFormData(false, ['c', 'd']) as Parameters<
    typeof exploreReducer
  >[1];
  const newState = exploreReducer(initialState, restoreAction);
  expect(newState).toBe(initialState);
});
