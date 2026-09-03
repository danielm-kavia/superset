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
import type { AnyAction } from 'redux';
import { setupStore } from './store';

const increment = { type: 'counter/increment' };

const counterReducer = (state = 0, action: AnyAction) =>
  action.type === increment.type ? state + 1 : state;

test('setupStore preserves preloaded custom reducer state and dispatches actions', () => {
  const testStore = setupStore({
    disableDebugger: true,
    initialState: { counter: 2 },
    rootReducers: { counter: counterReducer },
  });

  expect(testStore.getState()).toMatchObject({ counter: 2 });

  testStore.dispatch(increment);

  expect(testStore.getState()).toMatchObject({ counter: 3 });
});
