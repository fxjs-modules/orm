import React from 'react';

const initialState = {
  counter: 0,
  person: {
    age: 0,
    firstName: '',
    lastName: '',
  },
  dbManagementForm: {
    connection: 'mysql://root@localhost:3306/mysql',
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'increment':
      return {
        ...state,
        counter: state.counter + 1,
      };
    case 'decrement':
      return {
        ...state,
        counter: state.counter - 1,
      };
    case 'setFirstName':
      return {
        ...state,
        person: {
          ...state.person,
          firstName: action.firstName,
        },
      };
    case 'setLastName':
      return {
        ...state,
        person: {
          ...state.person,
          lastName: action.lastName,
        },
      };
    case 'setAge':
      return {
        ...state,
        person: {
          ...state.person,
          age: action.age,
        },
      };
    default:
      return state;
  }
};

const StateCtx = React.createContext(initialState);
const DispatchCtx = React.createContext((() => 0));

export const Provider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={state}>
        {children}
      </StateCtx.Provider>
    </DispatchCtx.Provider>
  );
};

export const useDispatch = () => {
  return React.useContext(DispatchCtx);
};

export const useGlobalState = (property) => {
  const state = React.useContext(StateCtx);
  return state[property]; // only one depth selector for comparison
};