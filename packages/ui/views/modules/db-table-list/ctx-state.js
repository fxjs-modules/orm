export const initialState = {
    counter: 0,
    connection: window.localStorage.getItem('orm-ui/test-dbconnection') || 'mysql://root@localhost:3306/mysql',
    dbInfo: null,
    dbTableList: {
        tables: []
    },
    focusingTable: null,
    focusingColumn: null,
};

export const reducer = (state, action) => {
    switch (action.type) {
        case 'update:connection':
            return {
                ...state,
                connection: action.connection,
            };
        case 'update:dbTableList':
            return {
                ...state,
                dbTableList: action.dbTableList,
            };
        case 'update:dbInfo':
            return {
                ...state,
                dbInfo: action.dbInfo,
            };
        case 'set:focusingTable':
            return {
                ...state,
                focusingTable: action.table,
            };
        case 'set:focusingColumn':
            return {
                ...state,
                ...action.column && action.column.$table && {
                    focusingTable: action.column.$table
                },
                focusingColumn: action.column,
            };
        default:
            return state;
    }
};