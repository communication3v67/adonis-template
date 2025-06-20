import { Group, Select, TextInput } from '@mantine/core'
import { FilterState } from '../../types'
import { calculateQuickDateRange } from '../../utils/formatters'
import { QUICK_DATE_PERIODS } from '../../utils/constants'

interface DateFiltersProps {
    filters: FilterState
    onUpdate: (key: keyof FilterState, value: string) => void
    onUpdateRange: (dateFrom: string, dateTo: string) => void
}

export const DateFilters = ({ filters, onUpdate, onUpdateRange }: DateFiltersProps) => {
    const handleQuickPeriod = (value: string | null) => {
        if (!value) {
            onUpdateRange('', '')
            return
        }
        
        const { dateFrom, dateTo } = calculateQuickDateRange(value)
        onUpdateRange(dateFrom, dateTo)
    }

    return (
        <Group grow>
            <TextInput
                label="Date de début"
                placeholder="YYYY-MM-DD"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onUpdate('dateFrom', e.target.value)}
            />
            
            <TextInput
                label="Date de fin"
                placeholder="YYYY-MM-DD"
                type="date"
                value={filters.dateTo}
                onChange={(e) => onUpdate('dateTo', e.target.value)}
            />
            
            <Select
                label="Période rapide"
                placeholder="Sélectionner une période"
                data={QUICK_DATE_PERIODS}
                onChange={handleQuickPeriod}
                clearable
            />
        </Group>
    )
}
