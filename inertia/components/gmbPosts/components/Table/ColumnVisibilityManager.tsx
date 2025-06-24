import { ActionIcon, Button, Divider, Drawer, Group, Stack, Switch, Text, Badge } from '@mantine/core'
import { useState, useEffect } from 'react'
import { LuEye, LuEyeOff, LuSettings2, LuSave } from 'react-icons/lu'

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
    onResetToDefaults?: () => void
}

export const ColumnVisibilityManager = ({
    columns,
    onColumnsChange,
    onResetWidths,
    onResetToDefaults,
}: ColumnVisibilityManagerProps) => {
    const [drawerOpened, setDrawerOpened] = useState(false)
    const [saveIndicator, setSaveIndicator] = useState(false)

    // Afficher un indicateur temporaire lors des sauvegardes
    useEffect(() => {
        if (saveIndicator) {
            const timer = setTimeout(() => setSaveIndicator(false), 1500)
            return () => clearTimeout(timer)
        }
    }, [saveIndicator])

    const toggleColumn = (key: string) => {
        const updatedColumns = columns.map((col) =>
            col.key === key ? { ...col, visible: !col.visible } : col
        )
        onColumnsChange(updatedColumns)
        setSaveIndicator(true)
    }

    const showAllColumns = () => {
        const updatedColumns = columns.map((col) => ({ ...col, visible: true }))
        onColumnsChange(updatedColumns)
        setSaveIndicator(true)
    }

    const hideOptionalColumns = () => {
        const updatedColumns = columns.map((col) =>
            col.required ? col : { ...col, visible: false }
        )
        onColumnsChange(updatedColumns)
        setSaveIndicator(true)
    }

    const visibleCount = columns.filter((col) => col.visible).length
    const totalCount = columns.length

    return (
        <>
            {/* Bouton pour ouvrir le drawer */}
            <ActionIcon
                size="lg"
                variant="light"
                color="blue"
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
                    {/* Statistiques et indicateur de sauvegarde */}
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                            {visibleCount} sur {totalCount} colonnes visibles
                        </Text>
                        {saveIndicator && (
                            <Badge
                                variant="light"
                                color="green"
                                size="sm"
                                leftSection={<LuSave size={12} />}
                            >
                                Sauvegardé
                            </Badge>
                        )}
                    </Group>

                    {/* Actions rapides */}
                    <Group gap="xs">
                        <Button size="xs" variant="light" onClick={showAllColumns}>
                            Tout afficher
                        </Button>
                        <Button size="xs" variant="light" onClick={hideOptionalColumns}>
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
                        {onResetToDefaults && (
                            <Button
                                size="xs"
                                variant="light"
                                color="red"
                                onClick={onResetToDefaults}
                            >
                                Réinitialiser tout
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
                                        color={column.visible ? 'blue' : 'gray'}
                                        onClick={() => !column.required && toggleColumn(column.key)}
                                        disabled={column.required}
                                        title={
                                            column.required
                                                ? 'Colonne obligatoire'
                                                : 'Basculer la visibilité'
                                        }
                                    >
                                        {column.visible ? (
                                            <LuEye size={14} />
                                        ) : (
                                            <LuEyeOff size={14} />
                                        )}
                                    </ActionIcon>
                                    <Text
                                        size="sm"
                                        style={{
                                            opacity: column.visible ? 1 : 0.6,
                                            flex: 1,
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
