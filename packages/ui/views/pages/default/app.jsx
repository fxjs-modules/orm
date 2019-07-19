import React from 'react'
import ReactDOM from 'react-dom'

function Todo () {
  const [title] = React.useState('I want to behave! @React')
  const [text, setText] = React.useState('')
  const [items, setItems] = React.useState([
    { title: 'Avoid excessive caffeine', done: true },
    { title: 'Hidden item', hidden: true },
    { title: 'Be less provocative'  },
    { title: 'Be nice to people' }
  ])


  const whatShowItems = items.filter(item => !item.hidden)
  const doneItems = items.filter(item => item.done)

  const inputEl = React.useRef(null);

  function edit (e) {
    setText(e.target.value)
  }

  function add (e) {
    if (text) {
      items.push({ title: text })
      setText('')
      inputEl.current.value = ''
    }
    e.preventDefault()

    setItems(items)
  }

  function removeAllDone (e) {
    const _items = items.filter(function(item) {
      return !item.done
    })
    setItems(_items)
  }

  function toggle (item) {
    const _items = items.map(x => {
      if (x === item)
        x.done = !x.done

      return x
    })
    setItems(_items)
  }

  return (
    <div id="todo">
      <h3>{ title }</h3>

      <ul>
      {whatShowItems.map((item, idx_l1) => {
        return (
          <li
            key={idx_l1}
          >
            <label className={[
              item.done && 'completed'
            ].filter(x => x).join(' ')}>
              <input
                type="checkbox"
                checked={item.done}
                onClick={() => toggle(item)}
              />
              { item.title }
            </label>
          </li>
        );
      })}
      </ul>

    <form
      action=""
      onSubmit={add}
    >
      <input
        ref={inputEl}
        onKeyUp={edit}
      />
      <button
        disabled={!text}
      >
        Add #{whatShowItems.length + 1}
      </button>

      <button
        type="button"
        disabled={doneItems.length == 0}
        onClick={removeAllDone}
      >
        X { doneItems.length }
      </button>
    </form>
  </div>
  );
};

ReactDOM.render(
	<Todo />,
	document.querySelector('#app')
);

console.log('123123')

