import { Group, Box, Text } from '@mantine/core'
import { LuArrowDown, LuArrowUp, LuMoveHorizontal } from 'react-icons/lu'

interface SortableHeaderProps {
    label: string
    sortKey: string
    currentSortBy: string
    currentSortOrder: string
    onSort: (sortBy: string, sortOrder: string) => void
}

export const SortableHeader = ({
    label,
    sortKey,
    currentSortBy,
    currentSortOrder,
    onSort,
}: SortableHeaderProps) => {
    const isActive = currentSortBy === sortKey
    const isAsc = isActive && currentSortOrder === 'asc'
    const isDesc = isActive && currentSortOrder === 'desc'

    const handleClick = () => {
        if (!isActive) {
            // Si la colonne n'est pas active, commencer par desc pour les dates, asc pour le reste
            onSort(sortKey, sortKey === 'date' ? 'desc' : 'asc')
        } else if (isDesc) {
            // Si desc, passer à asc
            onSort(sortKey, 'asc')
        } else {
            // Si asc, passer à desc
            onSort(sortKey, 'desc')
        }
    }

    return (
        <Group gap={4} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleClick}>
            <Text fw={500} size="sm">
                {label}
            </Text>
            <Box>
                {isActive ? (
                    isDesc ? (
                        <LuArrowDown size={14} style={{ color: '#228be6' }} />
                    ) : (
                        <LuArrowUp size={14} style={{ color: '#228be6' }} />
                    )
                ) : (
                    <LuMoveHorizontal size={14} style={{ color: '#adb5bd', opacity: 0.6 }} />
                )}
            </Box>
        </Group>
    )
}
