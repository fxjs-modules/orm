import React from 'react'

import { List, Form, Grid, Button } from 'semantic-ui-react'

import * as Reqs from '../../deps/requests'
import { StateProvider, useCtxState } from '../../deps/context-reducer'

function noOp () {}

const DbSetupForm = ({
  form
}) => {
  const [{connection, dbTableList}, dispatch] = useCtxState();

  const pullData = () => {
    Reqs.rpc('connect', { connection })
    .then(res => {
      if (!res)
        throw new Error('connnection error')

      return res
    })
    .then(dbInfo => {
      dispatch({
        type: 'update:dbInfo',
        dbInfo
      })
      
      dispatch({
        type: 'update:dbTableList',
        dbTableList: {
          ...dbTableList,
          name: dbInfo.database,
        }
      });

      return Reqs.rpc('getTableNames', {
        connection: dbInfo.href,
      }).then(tables => {
        dispatch({
          type: 'update:dbTableList',
          dbTableList: {
            ...dbTableList,
            tables: tables.map(tableName => ({
              name: tableName,
              columns: []
            }))
          }
        })
      })
    })
    .catch(error => {
      console.error(error)
      alert(error.message)
    })
  }

  React.useEffect(() => {
    pullData();
  }, [])
  
  return (
    <Form>
      <Form.Group widths='equal'>
        <Form.Input
          fluid
          label='DB 连接'
          placeholder='mysql://[user[:pwd]@]host[:port][/schema]'
          onChange={(evt) => {
            dispatch({
              type: 'update:connection',
              connection: evt.target.value
            })
          }}
          value={connection}
        />
      </Form.Group>

      <Form.Button
        onClick={() => {
          pullData();
        }}
      >
        连接
      </Form.Button>
    </Form>
  )
}

function TableItem ({
  dbInfo,
  table,
  onUpdateTable = noOp
}) {
  const thisRef = React.useRef(null)
  
  return (
    <List.Item
      ref={thisRef}
      className="table-item-treenode"
      onClick={(evt) => {
        const el = evt.target;

        if (!el.getAttribute('data-click-proxy')) {
          return
        }

        table.$toggled = !table.$toggled;

        if (!table.$toggled)
          onUpdateTable(table)
        else
          Reqs.rpc('getTableSemanticColumns', {
            connection: dbInfo.href,
            table: table.name
          }).then(columnsSemanticInfos => {
            table.$columns = columnsSemanticInfos
            table.columns = Object.keys(columnsSemanticInfos).map((colName, colIdx) => {
              return {
                name: colName,
                meta: columnsSemanticInfos[colName],
                $table: table,
                $idx_in_table: colIdx,
              }
            })
            
            onUpdateTable(table);
          })
      }}
    >
      <List.Icon data-click-proxy name={'table'} />
      <List.Content>
        <List.Header data-click-proxy>{table.name}</List.Header>
        <List.Description data-click-proxy>@${dbInfo.database}</List.Description>
        {!table.$toggled || !table.columns || !table.columns.length ? null : (
          <List.List>
            {table.columns.map(column => {
              return (
                <ColumnItem
                  key={`table-${table.name}-column-${column.name}`}
                  dbInfo={dbInfo}
                  table={table}
                  column={column}
                />
              )
            })}
          </List.List>
        )}
      </List.Content>
    </List.Item>
  );
}

function ColumnItem ({
  dbInfo,
  table,
  column,
}) {
  const [_, dispatch] = useCtxState();
    
  return (
    <List.Item
      onClick={() => {
        dispatch({
          type: 'set:focusingColumn',
          column
        });
        
        dispatch({
          type: 'set:focusingTable',
          table
        });
      }}
    >
      <List.Icon name={'columns'} />
      <List.Content>
        <List.Header>{column.name}</List.Header>
        <List.Description>
          @{dbInfo.database}.{table.name}
        </List.Description>
      </List.Content>
    </List.Item>
  );
}

const DbTableManger = () => {
  const [ {dbInfo, dbTableList, focusingColumn, focusingTable}, dispatch ] = useCtxState()

  if (!dbInfo)
    return null;
  
  return (
    <Grid celled>
      <Grid.Row
        className="table-mnger-row"
      >
        <Grid.Column width={5}>
          <List
            // divided
            // horizontal
            size={'large'}
            >
            <List.Item>
              <List.Icon name='database' />
              <List.Content>
                <List.Header>{dbInfo.database}</List.Header>
                <List.Description>Current Database</List.Description>
                <List.List>
                  {dbInfo && dbTableList.tables.map((table, table_idx) => {
                    return (
                      <TableItem
                        key={`db-${dbInfo.database}-table-${table.name}`}
                        table={table}
                        dbInfo={dbInfo}
                        onUpdateTable={(newtable) => {
                          dbTableList[table_idx] = newtable;

                          dispatch({
                            type: 'update:dbTableList', dbTableList: { ...dbTableList }
                          })
                        }}
                      />
                    );
                  })}
                </List.List>
              </List.Content>
            </List.Item>
          </List>
        </Grid.Column>
        <Grid.Column
          className="table-details"
          width={11}
        >
          {focusingColumn && (
            <Form>
              <Form.Field>
                <label>表</label>
                {focusingTable.name}
              </Form.Field>
              <Form.Field>
                <label>字段名</label>
                <b>{focusingColumn.name}</b>
              </Form.Field>
              <Form.Field>
                <label>描述</label>
                {focusingColumn.description || '-'}
                {/* <input placeholder='Last Name' /> */}
              </Form.Field>

              <hr />
              <Form.Field>
                <label>size</label>
                {focusingColumn.meta.size || '-'}
              </Form.Field>
              <Form.Field>
                <label>type</label>
                {focusingColumn.meta.type || '-'}
              </Form.Field>
              {/* <Form.Field>
                <Checkbox label='I agree to the Terms and Conditions' />
              </Form.Field> */}
              <Form.Field>
                <label>默认值</label>
                <input
                  placeholder='请填写合适的默认值'
                  value={focusingColumn.meta.defaultValue}
                  onChange={evt => {
                    focusingColumn.meta = focusingColumn.meta || {};
                    focusingColumn.meta.defaultValue = evt.target.value;

                    dispatch({
                      type: 'set:focusingColumn',
                      column: {
                        ...focusingColumn,
                      }
                    })
                  }}
                />
              </Form.Field>
              <Button secondary>生成更新 SQL</Button>
              <Button /* primary */ color='red'>更新字段属性</Button>
            </Form>
          )}
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}

import { initialState, reducer } from './ctx-state';

export default function App () {  
  return (
    <>
      <link rel="stylesheet" href="/modules/db-table-list/index.styl" />
      <StateProvider initialState={initialState} reducer={reducer}>
        <DbSetupForm />
        <DbTableManger />
      </StateProvider>
    </>
  )
}