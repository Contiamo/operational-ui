import * as React from "react"
import { render, mount } from "enzyme"

import ThemelessPaginator from "../Paginator"
import wrapDefaultTheme from "../../../utils/wrap-default-theme"

const Paginator = wrapDefaultTheme(ThemelessPaginator)

class StatefulPaginator extends React.Component {
  state = {
    page: 2
  }

  handleChange (newPage) {
    this.setState(prevState => ({page: newPage}))
  }

  render() {
    return (
      <Paginator
        pageCount={100}
        selected={this.state.page}
        onChange={newPage => { this.handleChange(newPage) }}
      />
    )
  }
}

describe("Paginator Component", () => {
  it("Should initialize properly", () => {
    expect(render(<Paginator pageCount={10} onChange={newPage => {}} />)).toMatchSnapshot()
  })
  it("Should respond to page changes", () => {
    const testFn = jest.fn()
    const comp = mount(<Paginator pageCount={10} onChange={testFn} />)
    comp.find('li.control.next').simulate('click')
    expect(testFn).toHaveBeenCalled()
  })
  it('Should update state of container component', () => {
    const comp = mount(<StatefulPaginator />)
    comp.find('li.control.next').simulate('click')
    expect(comp.state().page).toBe(3)
  })
})