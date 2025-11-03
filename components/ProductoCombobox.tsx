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

interface ProductoComboboxProps {
  value?: string | number
  onChange: (value: string) => void
  productos: Array<{
    id: string | number
    label: string
    sublabel?: string
  }>
  placeholder?: string
  emptyMessage?: string
  className?: string
}

export function ProductoCombobox({
  value,
  onChange,
  productos,
  placeholder = 'Seleccionar...',
  emptyMessage = 'No se encontraron resultados',
  className,
}: ProductoComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  const normalizedValue = value !== undefined && value !== null ? value.toString() : ''

  const selectedProducto = productos.find(
    (producto) => producto.id.toString() === normalizedValue
  )

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
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Buscar producto..."
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

