'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ProductoComboboxProps {
  value?: string | number
  onChange: (value: string) => void
  productos: Array<{
    id: string | number
    label: string
    sublabel?: string
    meta?: Record<string, string | number | null | undefined>
  }>
  placeholder?: string
  emptyMessage?: string
  className?: string
  searchPlaceholder?: string
  filters?: Array<{
    key: string
    label: string
    options: Array<{ value: string; label: string }>
  }>
}

export function ProductoCombobox({
  value,
  onChange,
  productos,
  placeholder = 'Seleccionar...',
  emptyMessage = 'No se encontraron resultados',
  className,
  searchPlaceholder = 'Buscar producto...',
  filters,
}: ProductoComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({})

  const normalizedValue = value !== undefined && value !== null ? value.toString() : ''

  const selectedProducto = productos.find(
    (producto) => producto.id.toString() === normalizedValue
  )

  React.useEffect(() => {
    if (filters && filters.length > 0) {
      const initialValues: Record<string, string> = {}
      filters.forEach((filter) => {
        const defaultOption = filter.options[0]?.value ?? ''
        initialValues[filter.key] = defaultOption
      })
      setFilterValues(initialValues)
    }
  }, [filters])

  function matchesFilters(producto: ProductoComboboxProps['productos'][number]) {
    if (!filters || filters.length === 0) return true
    return filters.every((filter) => {
      const selectedValue = filterValues[filter.key]
      if (!selectedValue || selectedValue === 'todos') return true
      const metaValue = producto.meta?.[filter.key]
      if (metaValue === undefined || metaValue === null) return false
      return metaValue.toString() === selectedValue
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-9 font-normal',
            !normalizedValue && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {selectedProducto ? selectedProducto.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          {filters && filters.length > 0 && (
            <div className="grid gap-2 p-3 border-b bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Filtros
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-1">
                    <Label className="text-[11px] uppercase text-muted-foreground tracking-wide">
                      {filter.label}
                    </Label>
                    <Select
                      value={filterValues[filter.key]}
                      onValueChange={(value) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          [filter.key]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {productos
                .filter((producto) => {
                  if (!matchesFilters(producto)) return false
                  if (!searchValue) return true
                  const search = searchValue.toLowerCase()
                  return (
                    producto.label.toLowerCase().includes(search) ||
                    producto.sublabel?.toLowerCase().includes(search)
                  )
                })
                .map((producto) => (
                  <CommandItem
                    key={producto.id}
                    value={producto.id.toString()}
                    onSelect={(currentValue) => {
                      onChange(currentValue)
                      setOpen(false)
                      setSearchValue('')
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        normalizedValue === producto.id.toString() ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{producto.label}</span>
                      {producto.sublabel && (
                        <span className="text-xs text-muted-foreground">
                          {producto.sublabel}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

