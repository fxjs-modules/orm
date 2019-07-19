import React from 'react'
import ReactDOM from 'react-dom'
import { Grid, Button, Header, Icon, Image, Menu, Segment, Sidebar } from 'semantic-ui-react'

const imageLink = `https://react.semantic-ui.com/images/wireframe/paragraph.png`

const menuCfgs = [
  [
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
        name: 'playground',
        label: 'Playground',
        icon: 'gamepad',
        color: undefined,
      },
      {
        name: 'snapshot',
        label: '快照',
        icon: 'camera',
        color: 'purple',
      }
    ]
  ]
]
export function App () {
  const [visible, setVisible] = React.useState(true)
  const [activeMenuItem, setActiveMenuItem] = React.useState('dashboard')

  const [
    [com1, setCom1]
  ] = [
    React.useState(null)
  ]

  React.useEffect(() => {
    System.import('/modules/test-mod/index.system.jsx')
      .then((mod) => {
        console.log('mod', mod)
        setCom1(mod.default)
      })
  }, [])

  return (
    <>
      {com1 && <com1 />}
      <Sidebar.Pushable
        as={Segment}
        style={{
          height: '100%',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
        >
        <Sidebar
          as={Menu}
          animation={'push'}
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
        </Sidebar>

        <Sidebar.Pusher>
          <Segment basic>
            <Header as='h3'>ORM 状态</Header>
          </Segment>
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    </>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
