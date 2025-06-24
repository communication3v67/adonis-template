import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Grid,
    Group,
    Paper,
    Stack,
    Tabs,
    Text,
    Tooltip,
} from '@mantine/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    LuArrowRight,
    LuFilter,
    LuFilterX,
    LuPlus,
    LuRefreshCw,
    LuSettings,
    LuTriangleAlert,
    LuZap,
} from 'react-icons/lu'
import {
    AdvancedFilter,
    AdvancedFilterState,
    FILTERABLE_PROPERTIES,
    FilterGroup,
    FilterOptions,
    FilterProperty,
    FilterState,
    createDefaultFilterGroup,
} from '../../types'
import { FilterGroupComponent } from '../AdvancedFilters/FilterGroupComponent'
import { DateFilters } from '../Filters/DateFilters'
import { FilterBadges } from '../Filters/FilterBadges'
import { FilterDropdowns } from '../Filters/FilterDropdowns'
import { QuickFilters } from '../Filters/QuickFilters'
import { SearchInput } from '../Filters/SearchInput'

interface ConflictInfo {
    type: 'overlap' | 'conflict'
    property: string
    quickValue: string
    advancedValue: string
    message: string
}

interface UnifiedFilterSectionProps {
    filters: FilterState
    filterOptions: FilterOptions
    totalResults: number
    isApplyingFilters: boolean
    basicActiveFiltersCount: number
    advancedActiveFiltersCount: number
    totalActiveFilters: number
    hasAnyActiveFilters: boolean
    forceUpdateKey?: number // Clé pour forcer le re-render
    // Actions unifiées pour les filtres rapides
    onUpdateFilter: (key: keyof FilterState, value: string) => void
    onUpdateDateRange: (dateFrom: string, dateTo: string) => void
    onResetAllFilters: () => void
    // Props pour les filtres avancés
    advancedFilters: AdvancedFilterState
    hasActiveAdvancedFilters: boolean
    onUpdateAdvancedFilters: (filters: AdvancedFilterState) => void
    onResetAdvancedFilters: () => void
}

export const UnifiedFilterSection = ({
    filters,
    filterOptions,
    totalResults,
    isApplyingFilters,
    basicActiveFiltersCount,
    advancedActiveFiltersCount,
    totalActiveFilters,
    hasAnyActiveFilters,
    forceUpdateKey = 0,
    onUpdateFilter,
    onUpdateDateRange,
    onResetAllFilters,
    // Props filtres avancés
    advancedFilters,
    hasActiveAdvancedFilters,
    onUpdateAdvancedFilters,
    onResetAdvancedFilters,
}: UnifiedFilterSectionProps) => {
    const [activeTab, setActiveTab] = useState<string>('quick')
    const [localAdvancedFilters, setLocalAdvancedFilters] =
        useState<AdvancedFilterState>(advancedFilters)
    const [showConflictDetails, setShowConflictDetails] = useState(false)

    // Synchroniser les filtres avancés locaux
    useEffect(() => {
        console.log('=== SYNCHRONISATION FILTRES AVANCÉS UNIFIÉS ===')
        setLocalAdvancedFilters(advancedFilters)
        console.log('===============================================')
    }, [advancedFilters])

    // Fonction pour détecter les conflits entre filtres rapides et avancés
    const detectConflicts = useCallback((): ConflictInfo[] => {
        if (!hasActiveAdvancedFilters) return []

        const conflicts: ConflictInfo[] = []

        // Fonction helper pour trouver tous les filtres avancés d'une propriété
        const getAdvancedFiltersForProperty = (property: string): AdvancedFilter[] => {
            return localAdvancedFilters.groups.flatMap((group) =>
                group.filters.filter(
                    (filter) =>
                        filter.property === property &&
                        filter.value !== '' &&
                        filter.value !== null &&
                        filter.value !== undefined
                )
            )
        }

        // Vérification des conflits pour chaque propriété
        const conflictMappings = [
            { quickKey: 'search' as keyof FilterState, advancedKey: 'text', label: 'Recherche' },
            { quickKey: 'status' as keyof FilterState, advancedKey: 'status', label: 'Statut' },
            { quickKey: 'client' as keyof FilterState, advancedKey: 'client', label: 'Client' },
            {
                quickKey: 'project' as keyof FilterState,
                advancedKey: 'project_name',
                label: 'Projet',
            },
        ]

        conflictMappings.forEach(({ quickKey, advancedKey, label }) => {
            const quickValue = filters[quickKey]
            const advancedFiltersForProperty = getAdvancedFiltersForProperty(advancedKey)

            if (quickValue && advancedFiltersForProperty.length > 0) {
                advancedFiltersForProperty.forEach((advFilter) => {
                    let conflictType: 'overlap' | 'conflict' = 'overlap'
                    let message = ''

                    // Analyser le type de conflit selon l'opérateur
                    switch (advFilter.operator) {
                        case 'equals':
                            if (advFilter.value === quickValue) {
                                conflictType = 'overlap'
                                message = `Filtre redondant : "${quickValue}" est filtré à la fois en rapide et avancé`
                            } else {
                                conflictType = 'conflict'
                                message = `Conflit : filtre rapide "${quickValue}" vs avancé "${advFilter.value}"`
                            }
                            break
                        case 'contains':
                            if (
                                quickKey === 'search' &&
                                typeof advFilter.value === 'string' &&
                                (quickValue.includes(advFilter.value) ||
                                    advFilter.value.includes(quickValue))
                            ) {
                                conflictType = 'overlap'
                                message = `Filtre redondant : recherche "${quickValue}" chevauche avec le filtre avancé "${advFilter.value}"`
                            } else {
                                conflictType = 'conflict'
                                message = `Conflit potentiel : recherche rapide vs filtre avancé contenant "${advFilter.value}"`
                            }
                            break
                        case 'not_equals':
                        case 'not_contains':
                            conflictType = 'conflict'
                            message = `Conflit : filtre rapide "${quickValue}" avec exclusion avancée "${advFilter.value}"`
                            break
                        default:
                            conflictType = 'overlap'
                            message = `Filtres simultanés sur ${label.toLowerCase()}`
                    }

                    conflicts.push({
                        type: conflictType,
                        property: advancedKey,
                        quickValue: quickValue,
                        advancedValue: String(advFilter.value),
                        message,
                    })
                })
            }
        })

        // Vérification spéciale pour les dates
        if (
            (filters.dateFrom || filters.dateTo) &&
            getAdvancedFiltersForProperty('date').length > 0
        ) {
            conflicts.push({
                type: 'overlap',
                property: 'date',
                quickValue: `${filters.dateFrom} - ${filters.dateTo}`,
                advancedValue: 'Filtres de date avancés',
                message: 'Filtres de date définis à la fois en rapide et avancé',
            })
        }

        return conflicts
    }, [filters, localAdvancedFilters, hasActiveAdvancedFilters])

    const conflicts = useMemo(() => detectConflicts(), [detectConflicts])
    const hasConflicts = conflicts.length > 0
    const hasRealConflicts = conflicts.some((c) => c.type === 'conflict')

    // Enrichir les propriétés avec les options du backend
    const enrichedProperties: FilterProperty[] = FILTERABLE_PROPERTIES.map((prop) => {
        if (prop.type === 'select') {
            switch (prop.key) {
                case 'status':
                    return { ...prop, options: filterOptions.statuses }
                case 'client':
                    return { ...prop, options: filterOptions.clients }
                case 'project_name':
                    return { ...prop, options: filterOptions.projects }
                default:
                    return prop
            }
        }
        return prop
    })

    // === GESTIONNAIRES POUR FILTRES RAPIDES ===
    const handleQuickFilterUpdate = (key: keyof FilterState, value: string) => {
        onUpdateFilter(key, value)
    }

    const handleQuickDateRangeUpdate = (dateFrom: string, dateTo: string) => {
        onUpdateDateRange(dateFrom, dateTo)
    }

    // === GESTIONNAIRES POUR FILTRES AVANCÉS ===
    const handleAddAdvancedGroup = () => {
        const newGroup = createDefaultFilterGroup()
        const newFilters = {
            ...localAdvancedFilters,
            isActive: true,
            groups: [...localAdvancedFilters.groups, newGroup],
        }
        setLocalAdvancedFilters(newFilters)
        onUpdateAdvancedFilters(newFilters)
    }

    const handleUpdateAdvancedGroup = (groupId: string, updatedGroup: FilterGroup) => {
        const newFilters = {
            ...localAdvancedFilters,
            groups: localAdvancedFilters.groups.map((group) =>
                group.id === groupId ? updatedGroup : group
            ),
        }
        setLocalAdvancedFilters(newFilters)
        onUpdateAdvancedFilters(newFilters)
    }

    const handleRemoveAdvancedGroup = (groupId: string) => {
        const newFilters = {
            ...localAdvancedFilters,
            groups: localAdvancedFilters.groups.filter((group) => group.id !== groupId),
            isActive:
                localAdvancedFilters.groups.filter((group) => group.id !== groupId).length > 0,
        }
        setLocalAdvancedFilters(newFilters)
        onUpdateAdvancedFilters(newFilters)
    }

    const handleResetAdvanced = () => {
        onResetAdvancedFilters()
        setShowConflictDetails(false)
    }

    // === GESTIONNAIRES POUR RÉSOLUTION DE CONFLITS ===
    const resolveConflictByKeepingQuick = () => {
        console.log('🔧 Résolution de conflit : conservation des filtres rapides')
        handleResetAdvanced()
    }

    const resolveConflictByKeepingAdvanced = () => {
        console.log('🔧 Résolution de conflit : conservation des filtres avancés')

        // Réinitialiser tous les filtres rapides qui sont en conflit
        conflicts.forEach((conflict) => {
            switch (conflict.property) {
                case 'text':
                    onUpdateFilter('search', '')
                    break
                case 'status':
                    onUpdateFilter('status', '')
                    break
                case 'client':
                    onUpdateFilter('client', '')
                    break
                case 'project_name':
                    onUpdateFilter('project', '')
                    break
                case 'date':
                    onUpdateDateRange('', '')
                    break
            }
        })
        setShowConflictDetails(false)
    }

    // === GESTIONNAIRE POUR MIGRATION RAPIDE → AVANCÉ ===
    const migrateQuickToAdvanced = (property: string, operator: string, value: string) => {
        if (!value) return

        // Créer un nouveau groupe avec le filtre migré
        const newGroup = createDefaultFilterGroup()
        newGroup.filters[0] = {
            ...newGroup.filters[0],
            property,
            operator: operator as any,
            value,
        }

        const newFilters = {
            ...localAdvancedFilters,
            isActive: true,
            groups: [...localAdvancedFilters.groups, newGroup],
        }

        setLocalAdvancedFilters(newFilters)
        onUpdateAdvancedFilters(newFilters)

        // Basculer vers l'onglet avancé
        setActiveTab('advanced')

        // Nettoyer le filtre rapide correspondant
        switch (property) {
            case 'text':
                onUpdateFilter('search', '')
                break
            case 'status':
                onUpdateFilter('status', '')
                break
            case 'client':
                onUpdateFilter('client', '')
                break
            case 'project_name':
                onUpdateFilter('project', '')
                break
        }
    }

    const handleRemoveFilter = (key: keyof FilterState) => {
        if (key === 'dateFrom') {
            onUpdateDateRange('', '')
        } else {
            onUpdateFilter(key, '')
        }
    }

    const handleResetAll = () => {
        onResetAllFilters()
        handleResetAdvanced()
        setShowConflictDetails(false)
    }

    return (
        <Card withBorder p="md">
            <Stack gap="md">
                {/* En-tête avec résumé des filtres actifs */}
                <Group justify="space-between">
                    <Group gap="xs">
                        <Text fw={500}>Filtres</Text>
                        {hasAnyActiveFilters && (
                            <Badge variant="light" color="blue" size="sm">
                                {totalActiveFilters} actif{totalActiveFilters > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </Group>
                    <Group gap="xs">
                        <FilterBadges filters={filters} onRemoveFilter={handleRemoveFilter} />
                        {hasActiveAdvancedFilters && (
                            <Badge
                                variant="light"
                                color="indigo"
                                leftSection={<LuFilter size={12} />}
                                size="sm"
                            >
                                {advancedActiveFiltersCount} avancé
                                {advancedActiveFiltersCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </Group>
                </Group>

                {/* Système d'alerte pour les conflits */}
                {hasConflicts && (
                    <Alert
                        color={hasRealConflicts ? 'red' : 'yellow'}
                        icon={<LuTriangleAlert size={16} />}
                        title={
                            hasRealConflicts
                                ? `${conflicts.filter((c) => c.type === 'conflict').length} conflit(s) détecté(s)`
                                : `${conflicts.length} chevauchement(s) détecté(s)`
                        }
                        withCloseButton
                        onClose={() => setShowConflictDetails(false)}
                    >
                        <Stack gap="xs">
                            <Text size="sm">
                                {hasRealConflicts
                                    ? 'Des filtres rapides et avancés sont en conflit, ce qui peut donner des résultats inattendus.'
                                    : 'Des filtres rapides et avancés filtrent les mêmes propriétés.'}
                            </Text>

                            {showConflictDetails && (
                                <Stack gap="xs" mt="xs">
                                    {conflicts.map((conflict, index) => (
                                        <Paper key={index} p="xs" bg="gray.0" radius="sm">
                                            <Text
                                                size="xs"
                                                c={conflict.type === 'conflict' ? 'red' : 'orange'}
                                            >
                                                • {conflict.message}
                                            </Text>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}

                            <Group gap="xs" mt="sm">
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => setShowConflictDetails(!showConflictDetails)}
                                >
                                    {showConflictDetails ? 'Masquer' : 'Détails'}
                                </Button>

                                {hasRealConflicts && (
                                    <>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="blue"
                                            onClick={resolveConflictByKeepingQuick}
                                        >
                                            Garder rapides
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="indigo"
                                            onClick={resolveConflictByKeepingAdvanced}
                                        >
                                            Garder avancés
                                        </Button>
                                    </>
                                )}
                            </Group>
                        </Stack>
                    </Alert>
                )}

                {/* Onglets pour basculer entre les modes */}
                <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'quick')}>
                    <Tabs.List>
                        <Tabs.Tab
                            value="quick"
                            leftSection={<LuZap size={16} />}
                            rightSection={
                                basicActiveFiltersCount > 0 ? (
                                    <Badge size="xs" variant="filled" color="blue">
                                        {basicActiveFiltersCount}
                                    </Badge>
                                ) : null
                            }
                        >
                            Filtres rapides
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="advanced"
                            leftSection={<LuSettings size={16} />}
                            rightSection={
                                hasActiveAdvancedFilters ? (
                                    <Badge size="xs" variant="filled" color="indigo">
                                        {advancedActiveFiltersCount}
                                    </Badge>
                                ) : null
                            }
                        >
                            Filtres avancés
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Onglet Filtres rapides */}
                    <Tabs.Panel value="quick">
                        <Stack gap="md" mt="md">
                            {/* Champ de recherche */}
                            <SearchInput
                                key={`search-${forceUpdateKey || 0}`}
                                value={filters.search}
                                onChange={(value) => handleQuickFilterUpdate('search', value)}
                            />

                            {/* Filtres par dropdowns */}
                            <FilterDropdowns
                                key={`dropdowns-${forceUpdateKey || 0}`}
                                filters={filters}
                                filterOptions={filterOptions}
                                onUpdate={handleQuickFilterUpdate}
                            />

                            {/* Filtres de date */}
                            <DateFilters
                                key={`dates-${forceUpdateKey || 0}`}
                                filters={filters}
                                onUpdate={handleQuickFilterUpdate}
                                onUpdateRange={handleQuickDateRangeUpdate}
                            />

                            {/* Filtres rapides prédéfinis */}
                            <QuickFilters
                                onUpdateFilter={handleQuickFilterUpdate}
                                onUpdateDateRange={handleQuickDateRangeUpdate}
                            />

                            {/* Section de migration vers les filtres avancés */}
                            <Divider label="Migration vers filtres avancés" />
                            <Grid>
                                <Grid.Col span={6}>
                                    <Button
                                        variant="light"
                                        color="indigo"
                                        size="xs"
                                        fullWidth
                                        leftSection={<LuArrowRight size={14} />}
                                        onClick={() =>
                                            migrateQuickToAdvanced(
                                                'text',
                                                'contains',
                                                filters.search || ''
                                            )
                                        }
                                        disabled={!filters.search}
                                    >
                                        Recherche → Avancé
                                    </Button>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Button
                                        variant="light"
                                        color="indigo"
                                        size="xs"
                                        fullWidth
                                        leftSection={<LuArrowRight size={14} />}
                                        onClick={() =>
                                            migrateQuickToAdvanced(
                                                'client',
                                                'equals',
                                                filters.client || ''
                                            )
                                        }
                                        disabled={!filters.client}
                                    >
                                        Client → Avancé
                                    </Button>
                                </Grid.Col>
                            </Grid>
                        </Stack>
                    </Tabs.Panel>

                    {/* Onglet Filtres avancés */}
                    <Tabs.Panel value="advanced">
                        <Stack gap="md" mt="md">
                            {/* Description */}
                            <Text size="sm" c="dimmed">
                                Créez des filtres complexes avec des conditions multiples,
                                similaires à ceux de Notion.
                            </Text>

                            {/* Groupes de filtres avancés */}
                            {localAdvancedFilters.groups.length === 0 ? (
                                <Paper
                                    p="md"
                                    bg="gray.0"
                                    radius="md"
                                    style={{ border: '2px dashed var(--mantine-color-gray-3)' }}
                                >
                                    <Stack align="center" gap="xs">
                                        <Text c="dimmed" ta="center" size="sm">
                                            Aucun filtre avancé configuré
                                        </Text>
                                        <Text c="dimmed" ta="center" size="xs">
                                            Utilisez les filtres rapides pour commencer ou créez un
                                            groupe de filtres avancés
                                        </Text>
                                    </Stack>
                                </Paper>
                            ) : (
                                <Stack gap="md">
                                    {localAdvancedFilters.groups.map((group, index) => (
                                        <div key={group.id}>
                                            <FilterGroupComponent
                                                group={group}
                                                properties={enrichedProperties}
                                                onUpdate={(updatedGroup) =>
                                                    handleUpdateAdvancedGroup(
                                                        group.id,
                                                        updatedGroup
                                                    )
                                                }
                                                onRemove={() => handleRemoveAdvancedGroup(group.id)}
                                                showCondition={
                                                    index < localAdvancedFilters.groups.length - 1
                                                }
                                            />

                                            {index < localAdvancedFilters.groups.length - 1 && (
                                                <Divider
                                                    label={
                                                        <Text size="sm" fw={500} c="blue">
                                                            {group.condition.toUpperCase()}
                                                        </Text>
                                                    }
                                                    labelPosition="center"
                                                    my="md"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </Stack>
                            )}

                            {/* Bouton d'ajout de groupe */}
                            <Button
                                variant="light"
                                leftSection={<LuPlus size={16} />}
                                onClick={handleAddAdvancedGroup}
                                fullWidth
                            >
                                Ajouter un groupe de filtres
                            </Button>

                            {/* Action de réinitialisation pour les filtres avancés uniquement */}
                            {hasActiveAdvancedFilters && (
                                <Group justify="center">
                                    <Button
                                        variant="subtle"
                                        leftSection={<LuRefreshCw size={16} />}
                                        onClick={handleResetAdvanced}
                                        size="sm"
                                    >
                                        Réinitialiser les filtres avancés
                                    </Button>
                                </Group>
                            )}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>

                <Divider />

                {/* Section de résultats et actions globales */}
                <Group justify="space-between">
                    <Group gap="md">
                        <Text size="sm" c="dimmed">
                            {totalResults} résultat{totalResults > 1 ? 's' : ''}
                        </Text>
                        <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                            💡 Cliquez sur les en-têtes de colonnes pour trier
                        </Text>
                    </Group>

                    <Group gap="xs">
                        <Tooltip label="Réinitialiser tous les filtres">
                            <ActionIcon
                                variant="light"
                                color="red"
                                onClick={handleResetAll}
                                disabled={!hasAnyActiveFilters}
                                size="lg"
                            >
                                <LuFilterX size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                {/* Note d'auto-application */}
                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                    ✨ Les filtres s'appliquent automatiquement en temps réel
                </Text>
            </Stack>
        </Card>
    )
}
