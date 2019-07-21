import React from 'react';

import { useDispatch, useGlobalState } from './state';

/**
 * @see https://medium.com/front-end-weekly/react-hooks-tutorial-for-pure-usereducer-usecontext-for-global-state-like-redux-and-comparison-dd3da5053624
 */
export default () => {
  const value = useGlobalState('counter');
  const dispatch = useDispatch();

  return (
    <div>
        <span>Count: {value}</span>
        <button
            type="button"
            onClick={React.useCallback(() => dispatch({ type: 'increment' }), [dispatch])}
        >
          +1
        </button>
        <button
            type="button"
            onClick={React.useCallback(() => dispatch({ type: 'decrement' }), [dispatch])}
        >
          -1
        </button>
    </div>
  );
};