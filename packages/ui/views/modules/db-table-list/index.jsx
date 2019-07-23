import React from 'react'
import Axios from 'axios'

import { List, Form, Grid } from 'semantic-ui-react'
// import { useDispatch, useGlobalState, Provider } from './state';

import * as Reqs from '../../deps/requests'

function noOp () {}

const DbSetupForm = ({
  onEvent = noOp,
  form
}) => {
  const options = [
    { key: 'm', text: 'Male', value: 'male' },
    { key: 'f', text: 'Female', value: 'female' },
    { key: 'o', text: 'Other', value: 'other' },
  ]

  const [dbConnection, setDbConnection] = React.useState(
    window.localStorage.getItem('orm-ui/test-dbconnection') || 'mysql://root@localhost:3306/mysql'
  )
  
  return (
    <Form>
      <Form.Group widths='equal'>
        <Form.Input
          fluid
          label='DB 连接'
          placeholder='mysql://[user[:pwd]@]host[:port][/schema]'
          onChange={(evt) => setDbConnection(evt.target.value)}
          value={dbConnection}
        />
        {/* <Form.Input fluid label='First name' placeholder='First name' />
        <Form.Input fluid label='Last name' placeholder='Last name' />
        <Form.Select fluid label='Gender' options={options} placeholder='Gender' /> */}
      </Form.Group>
      {/* <Form.Group inline>
        <label>Size</label>
        <Form.Radio
          label='Small'
          value='sm'
          checked={value === 'sm'}
          onChange={() => setValue('sm')}
        />
        <Form.Radio
          label='Medium'
          value='md'
          checked={value === 'md'}
          onChange={() => setValue('md')}
        />
        <Form.Radio
          label='Large'
          value='lg'
          checked={value === 'lg'}
          onChange={() => setValue('lg')}
        />
      </Form.Group> */}
      {/* <Form.TextArea label='About' placeholder='Tell us more about you...' />
      <Form.Checkbox label='I agree to the Terms and Conditions' /> */}

      <Form.Button
        onClick={() => {
          onEvent('click:connect', {
            form: { dbConnection }
          })
        }}
      >
        连接
      </Form.Button>
    </Form>
  )
}

function Table ({
  dbInfo,
  table
}) {
  React.useEffect(() => {
    Reqs.rpc('getTableSemanticColumns', {
      connection: dbInfo.href,
      table: table.name
    })
  }, [dbInfo.database, table.name]);
  
  return (
    <List.Item>
      <List.Icon name={table.icon || 'columns'} />
      <List.Content>
        <List.Header>{table.name}</List.Header>
        <List.Description>{table.description}</List.Description>
      </List.Content>
      {!table.columns || !table.columns.length ? null : (
        <List.List>
          {table.columns.map(column => {
            return (
              <Column column={column} />
            )
          })}
        </List.List>
      )}
    </List.Item>
  );
}

function Column ({
  dbInfo,
  column
}) {
    
  return (
    <List.Item>
      <List.Icon name={column.icon || 'columns'} />
      <List.Content>
        <List.Header>{column.name}</List.Header>
        <List.Description>{column.description}</List.Description>
      </List.Content>
    </List.Item>
  );
}

export default () => {
  const [dbInfo, setDbInfo] = React.useState(null)
  
  /**
   * 
   * @sample
   * [
   *    {
          name: 'a1',
          // icon: 'folder',
          description: 'one table named a1',
          columns: [
            {
              name: 'a1c1',
              description: 'a1c1',
              properties: [

              ]
            }
          ]
        },
        {
          name: 'a1',
          // icon: 'folder',
          description: 'one table named a1',
          columns: [
            {
              name: 'a1c1',
              description: 'a1c1',
              properties: [

              ]
            }
          ]
        }
      ]
   */
  const [dbTableList, setDbTableList] = React.useState({
    name: 'test-ui',
    tables: []
  })

  return (
    <>
      <link rel="stylesheet" href="/modules/db-table-list/index.styl" />
      <>
        <DbSetupForm
          onEvent={(evt_type, payload) => {
            switch (evt_type) {
              case 'click:connect':
                Reqs.rpc('connect', {
                  connection: payload.form.dbConnection
                })
                .then(res => {
                  if (!res)
                    throw new Error('connnection error')

                  return res
                })
                .then(dbInfo => {
                  setDbInfo(dbInfo)
                  setDbTableList({
                    ...dbTableList,
                    name: dbInfo.database
                  });

                  return Reqs.rpc('getTableNames', {
                    connection: dbInfo.href,
                  }).then(tables => ({
                    dbInfo,
                    tables
                  }))
                })
                .then(({dbInfo, tables}) => {
                  setDbTableList({
                    ...dbTableList,
                    tables: tables.map(tableName => ({
                      name: tableName,
                      description: `${tableName}@${dbInfo.database}`,
                      columns: []
                    }))
                  });
                })
                .catch(error => {
                  console.error(error)
                  alert(error.message)
                })
                break;
            
              default:
                break;
            }
          }}
        />
        <Grid celled>
          <Grid.Row
            className="table-mnger-row"
          >
            <Grid.Column width={5}>
              <List>
                <List.Item>
                  <List.Icon name='database' />
                  <List.Content>
                    <List.Header>{dbTableList.name}</List.Header>
                    <List.Description>Current Database</List.Description>
                    <List.List>
                      {dbInfo && dbTableList.tables.map(table => {
                        return (
                          <Table
                            table={table}
                            dbInfo={dbInfo}
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
              <div
              >
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </>
    </>
  )
}