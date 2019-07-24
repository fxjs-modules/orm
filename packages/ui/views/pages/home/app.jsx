import React from 'react'
import ReactDOM from 'react-dom'
import { Grid, Button, Header, Icon, Image, Menu, Segment, Sidebar } from 'semantic-ui-react'

const imageLink = `https://react.semantic-ui.com/images/wireframe/paragraph.png`

;[
  ['react', window.React],
  ['react-dom', window.ReactDOM],
  ['semantic-ui-react', window.semanticUIReact]
].forEach(([dep, depModule]) => {
  System.set(dep, depModule);
});

const menuCfgs = [
  [
    // group info
    {

    },
    [
      {
        name: 'dashboard',
        label: '仪表盘',
        icon: 'dashboard',
        color: undefined,
      },
      {
        name: 'RDM',
        label: 'RDM',
        icon: 'database',
        color: undefined,
      },
      // {
      //   name: 'playground',
      //   label: 'Playground',
      //   icon: 'gamepad',
      //   color: undefined,
      // },
      // {
      //   name: 'snapshot',
      //   label: '快照',
      //   icon: 'camera',
      //   color: 'purple',
      // }
    ]
  ]
]
export function App () {
  const [visible, setVisible] = React.useState(true)
  const [activeMenuItem, setActiveMenuItem] = React.useState('RDM')

  const [timer, setTimer] = React.useState(new Date())
  
  const [
    [Main, setMain]
  ] = [
    React.useState(null),
    React.useState(null),
  ]

  React.useEffect(() => {
    System.import('/modules/db-table-list/index.jsx')
      .then((mod) => setMain(() => mod.default))
  }, [])

  setInterval(() => {
    setTimer(new Date())
  }, 1000)

  return (
    <>
      <Sidebar.Pushable
        className="pushable-app"
        as={Segment}
        style={{
          height: '100%',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
        >
        <Sidebar
          className="sidebar-left"
          as={Menu}
          // animation={'push'}
          animation={'overlay'}
          direction={'left'}
          icon='labeled'
          // inverted
          vertical
          visible={visible}
          width='thin'
        >
          {
            menuCfgs.map(([groupCfg, items]) => {
              return (
                <Menu.Item>
                  <Menu.Header>
                    HI
                  </Menu.Header>
                  {items.map(({ name, label, icon, color }) => {
                    return (
                      <Menu.Item
                        name={name}
                        active={activeMenuItem === name}
                        link
                        color={color}
                        onClick={() => setActiveMenuItem(name)}
                        // as='a'
                      >
                        <Icon name={icon} />
                        {label}
                      </Menu.Item>
                    );
                  })}
                </Menu.Item>
              )
            })
          }
          <Menu.Item
            className="bottom-info"
          >
            <Icon name={'clock'} />
            {timer.toUTCString()}
          </Menu.Item>
        </Sidebar>

        <Sidebar.Pusher>
          <Segment
            basic
            style={{
              paddingRight: '12px'
            }}
          >
            <Header as='h3'>ORM 状态</Header>
            {Main && <Main />}
          </Segment>
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    </>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
