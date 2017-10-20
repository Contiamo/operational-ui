import * as React from "react"
import { Input } from "contiamo-ui-components"

export default (function() {
  class StatefulInput extends React.Component {
    state = {
      value: ""
    }

    render() {
      return (
        <Input
          placeholder="Name here"
          name="forForms"
          value={this.state.value}
          onChange={(value: string) => {
            this.setState(prevState => ({ value }))
          }}
        />
      )
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <StatefulInput />
    </div>
  )
})()
