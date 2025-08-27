"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Customer {
  id: number
  organizer: string
}

interface CustomerComboboxProps {
  customers: Customer[]
  value: number | ""
  onChange: (id: number | "") => void
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  
  // filter by organizer name
  const filtered = React.useMemo(
    () =>
      customers.filter((c) =>
        c.organizer.toLowerCase().includes(search.toLowerCase())
      ),
    [customers, search]
  )
  
  // find label for current value
  const selected = customers.find((c) => c.id === value)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? selected.organizer : "Select organizer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}> {/* ADD THIS LINE */}
          <CommandInput
            placeholder="Search organizer..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No organizer found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((c) => (
                <CommandItem
                  key={c.id}
                  value={String(c.id)}
                  onSelect={(val) => {
                    const id = Number(val)
                    onChange(id === value ? "" : id)
                    setOpen(false)
                  }}
                >
                  {c.organizer}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}