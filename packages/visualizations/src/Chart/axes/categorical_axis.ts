import { defaults, filter, flow, identity, isNil, map } from "lodash/fp"
import { axisPosition, computeRange, computeRequiredMargin, insertElements, positionBackgroundRect } from "./axis_utils"
import { setTextAttributes, setLineAttributes } from "../../utils/d3_utils"
import { scaleBand } from "d3-scale"
import * as styles from "./styles"
import {
  AxisAttributes,
  AxisClass,
  AxisComputed,
  AxisPosition,
  AxisType,
  CategoricalAxisOptions,
  ChartConfig,
  Computed,
  D3Selection,
  EventBus,
  Object,
  State,
  StateWriter,
  XAxisConfig,
  YAxisConfig
} from "../typings"

class CategoricalAxis implements AxisClass<string> {
  computed: AxisComputed
  data: string[]
  el: D3Selection
  events: EventBus
  isXAxis: boolean
  position: AxisPosition
  previous: AxisComputed
  sort: boolean = true
  state: State
  stateWriter: StateWriter
  type: AxisType = "categorical"

  constructor(state: State, stateWriter: StateWriter, events: EventBus, el: D3Selection, position: AxisPosition) {
    this.state = state
    this.stateWriter = stateWriter
    this.events = events
    this.position = position
    this.isXAxis = position[0] === "x"
    this.el = insertElements(el, position, this.state.current.get("computed").canvas.drawingDims)
    // this.el.on("mouseenter", this.onComponentHover(this))  }
  }

  // Categorical axis supports everything that supports ".toString()"
  validate(value: any): boolean {
    return !isNil(value)
  }

  update(options: CategoricalAxisOptions, data: string[]): void {
    this.data = flow(filter(this.validate), map(String))(options.values || data)
  }

  // Computations
  compute(): void {
    this.previous = this.computed
    const config: ChartConfig = this.state.current.get("config")
    const computedChart: Computed = this.state.current.get("computed")
    const range: [number, number] = computeRange(config, computedChart, this.position)
    this.computed = {
      range,
      ticks: this.data,
      scale: scaleBand()
        .range(range)
        .domain(this.data)
    }
    this.stateWriter(this.position, this.computed)
    this.previous = defaults(this.previous)(this.computed)
  }

  // Drawing
  draw(): void {
    this.drawTicks()
    this.drawBorder()
    positionBackgroundRect(this.el, this.state.current.get("config").duration)
  }

  private drawTicks(): void {
    const config: ChartConfig = this.state.current.get("config")
    const attributes: AxisAttributes = this.getAttributes()
    const startAttributes: AxisAttributes = this.getStartAttributes(attributes)

    const ticks: any = this.el
      .selectAll(`text.${styles.tick}.${styles[this.position]}`)
      .data(this.computed.ticks, String)

    ticks
      .enter()
      .append("svg:text")
      .call(setTextAttributes, startAttributes)
      .merge(ticks)
      .attr("class", `${styles.tick} ${styles[this.position]}`)
      .call(setTextAttributes, attributes, config.duration)

    ticks
      .exit()
      .transition()
      .duration(config.duration)
      .call(setTextAttributes, defaults({ opacity: 1e6 })(attributes))
      .remove()

    this.adjustMargins()
  }

  private getAttributes(): AxisAttributes {
    const tickOffset: number = this.state.current.get("config")[this.position].tickOffset
    return {
      dx: this.isXAxis ? 0 : tickOffset,
      dy: this.isXAxis ? tickOffset : "-0.4em",
      text: identity,
      x: this.isXAxis ? this.computed.scale : 0,
      y: this.isXAxis ? 0 : this.computed.scale
    }
  }

  private getStartAttributes(attributes: AxisAttributes): AxisAttributes {
    return defaults({
      x: this.isXAxis ? this.previous.scale : 0,
      y: this.isXAxis ? 0 : this.previous.scale
    })(attributes)
  }

  private adjustMargins(): void {
    const computedMargins: Object<number> = this.state.current.get("computed").axes.margins || {}
    const config: XAxisConfig | YAxisConfig = this.state.current.get("config")[this.position]
    const requiredMargin: number = computeRequiredMargin(this.el, computedMargins, config, this.position)
    if (computedMargins[this.position] === requiredMargin) {
      return
    }
    computedMargins[this.position] = requiredMargin
    this.stateWriter("margins", computedMargins)
    this.events.emit("margins:update")
    this.el.attr(
      "transform",
      `translate(${axisPosition(this.position, this.state.current.get("computed").canvas.drawingDims).join(",")})`
    )
  }

  private drawBorder(): void {
    const drawingDims: any = this.state.current.get("computed").canvas.drawingDims
    const border: Object<number> = {
      x1: 0,
      x2: this.isXAxis ? drawingDims.width : 0,
      y1: this.isXAxis ? 0 : drawingDims.height,
      y2: 0
    }
    this.el.select(`line.${styles.border}`).call(setLineAttributes, border)
  }

  remove(): void {}
}

export default CategoricalAxis
