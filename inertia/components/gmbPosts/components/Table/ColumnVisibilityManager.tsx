import { ActionIcon, Drawer, Switch, Text, Stack, Group, Button, Divider } from '@mantine/core'
import { useState } from 'react'
import { LuEye, LuEyeOff, LuSettings2 } from 'react-icons/lu'

export interface ColumnConfig {
    key: string
    label: string
    visible: boolean
    width: number
    minWidth?: number
    maxWidth?: number
    required?: boolean // Pour les colonnes obligatoires (checkbox, actions)
}

interface ColumnVisibilityManagerProps {
    columns: ColumnConfig[]
    onColumnsChange: (columns: ColumnConfig[]) => void
    onResetWidths?: () => void
}

export const ColumnVisibilityManager = ({ columns, onColumnsChange, onResetWidths }: ColumnVisibilityManagerProps) => {
    const [drawerOpened, setDrawerOpened] = useState(false)

    const toggleColumn = (key: string) => {
        const updatedColumns = columns.map(col => 
            col.key === key ? { ...col, visible: !col.visible } : col
        )
        onColumnsChange(updatedColumns)
    }

    const showAllColumns = () => {
        const updatedColumns = columns.map(col => ({ ...col, visible: true }))
        onColumnsChange(updatedColumns)
    }

    const hideOptionalColumns = () => {
        const updatedColumns = columns.map(col => 
            col.required ? col : { ...col, visible: false }
        )
        onColumnsChange(updatedColumns)
    }

    const visibleCount = columns.filter(col => col.visible).length
    const totalCount = columns.length

    return (
        <>
            {/* Bouton pour ouvrir le drawer */}
            <ActionIcon
                size="lg"
                variant="subtle"
                color="gray"
                onClick={() => setDrawerOpened(true)}
                title="Gérer les colonnes"
            >
                <LuSettings2 size={18} />
            </ActionIcon>

            {/* Drawer de gestion des colonnes */}
            <Drawer
                opened={drawerOpened}
                onClose={() => setDrawerOpened(false)}
                title="Gérer les colonnes"
                position="right"
                size="md"
            >
                <Stack gap="md">
                    {/* Statistiques */}
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                            {visibleCount} sur {totalCount} colonnes visibles
                        </Text>
                    </Group>

                    {/* Actions rapides */}
                    <Group gap="xs">
                        <Button
                            size="xs"
                            variant="light"
                            onClick={showAllColumns}
                        >
                            Tout afficher
                        </Button>
                        <Button
                            size="xs"
                            variant="light"
                            onClick={hideOptionalColumns}
                        >
                            Colonnes essentielles
                        </Button>
                        {onResetWidths && (
                            <Button
                                size="xs"
                                variant="light"
                                color="orange"
                                onClick={onResetWidths}
                            >
                                Réinitialiser largeurs
                            </Button>
                        )}
                    </Group>

                    <Divider />

                    {/* Liste des colonnes */}
                    <Stack gap="sm">
                        {columns.map((column) => (
                            <Group key={column.key} justify="space-between" wrap="nowrap">
                                <Group gap="xs" style={{ flex: 1 }}>
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color={column.visible ? "blue" : "gray"}
                                        onClick={() => !column.required && toggleColumn(column.key)}
                                        disabled={column.required}
                                        title={column.required ? "Colonne obligatoire" : "Basculer la visibilité"}
                                    >
                                        {column.visible ? <LuEye size={14} /> : <LuEyeOff size={14} />}
                                    </ActionIcon>
                                    <Text 
                                        size="sm" 
                                        style={{ 
                                            opacity: column.visible ? 1 : 0.6,
                                            flex: 1
                                        }}
                                    >
                                        {column.label}
                                        {column.required && (
                                            <Text component="span" size="xs" c="dimmed" ml={4}>
                                                (obligatoire)
                                            </Text>
                                        )}
                                    </Text>
                                </Group>
                                <Switch
                                    size="sm"
                                    checked={column.visible}
                                    onChange={() => !column.required && toggleColumn(column.key)}
                                    disabled={column.required}
                                />
                            </Group>
                        ))}
                    </Stack>
                </Stack>
            </Drawer>
        </>
    )
}
