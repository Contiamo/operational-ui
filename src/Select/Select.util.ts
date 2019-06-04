import { IOption, SelectProps, Value } from "./Select.types"
import { IContextMenuItem } from "../ContextMenu/ContextMenu.Item"

export const appendOption = (newOption: IContextMenuItem) => (
  existingOptions: IContextMenuItem[],
): IContextMenuItem[] => [...existingOptions, newOption]

export const truncateList = (maxLength?: number) => (options: SelectProps["options"]) =>
  maxLength ? options.slice(0, maxLength) : options

export const filterList = (filter: string) => (options: SelectProps["options"]) =>
  options.filter(option => {
    const filterPattern = new RegExp(filter, "ig")
    return String(option.label).match(filterPattern) || String(option.value).match(filterPattern)
  })

export const prependFilter = (filterItem: IContextMenuItem) => (items: IContextMenuItem[]): IContextMenuItem[] => [
  filterItem,
  ...items,
]

export const isOptionSelected = (value: any) => (option: IOption) => {
  if (!Array.isArray(value)) {
    return value === option.value
  }

  return value.includes(option.value)
}

export const getNewValue = (value: any) => (newValue: Value) => {
  if (Array.isArray(value)) {
    const newValueIndex = value.indexOf(newValue)
    if (newValueIndex === -1) {
      return [...value, newValue]
    } else {
      return [...value.slice(0, newValueIndex), ...value.slice(newValueIndex + 1)]
    }
  }
  return newValue
}

export const customInputSymbol = Symbol("custom input")

export const getDisplayValue = (internalValue: any, customInputValue: any, customInputSymbol: symbol) => {
  if (internalValue === customInputSymbol) {
    return customInputValue
  }

  if (Array.isArray(internalValue)) {
    return internalValue.join(", ")
  }

  return String(internalValue)
}

export const optionsToContextMenuItems = (overrides: (option: IOption) => Partial<IContextMenuItem>) => (
  options: IOption[],
) =>
  options.map(
    (option): IContextMenuItem => ({
      ...option,
      label: option.label || "", // It's optional in one but required in the other
      ...overrides(option),
    }),
  )
