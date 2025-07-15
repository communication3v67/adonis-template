import { useEffect, useState, useCallback, useRef } from 'react'
import { ColumnConfig } from '../components/gmbPosts/components/Table/ColumnVisibilityManager'

const STORAGE_KEY = 'gmb-posts-columns-state'

// Configuration par défaut des colonnes
const DEFAULT_COLUMNS: ColumnConfig[] = [
    {
        key: 'checkbox',
        label: 'Sélection',
        visible: true,
        width: 80,
        minWidth: 60,
        maxWidth: 100,
        required: true,
    },
    {
        key: 'id',
        label: 'ID',
        visible: true,
        width: 80,
        minWidth: 60,
        maxWidth: 120,
    },
    {
        key: 'readiness',
        label: '✓',
        visible: true,
        width: 50,
        minWidth: 40,
        maxWidth: 70,
        required: true,
    },
    { key: 'status', label: 'Statut', visible: true, width: 220, minWidth: 150, maxWidth: 300 },
    { key: 'text', label: 'Texte', visible: true, width: 600, minWidth: 250, maxWidth: 900 },
    { key: 'date', label: 'Date', visible: true, width: 220, minWidth: 150, maxWidth: 270 },
    {
        key: 'keyword',
        label: 'Mot-clé',
        visible: true,
        width: 200,
        minWidth: 130,
        maxWidth: 300,
    },
    { key: 'client', label: 'Client', visible: true, width: 220, minWidth: 150, maxWidth: 350 },
    {
        key: 'project_name',
        label: 'Projet',
        visible: true,
        width: 250,
        minWidth: 150,
        maxWidth: 400,
    },
    { key: 'city', label: 'Ville', visible: true, width: 190, minWidth: 130, maxWidth: 300 },
    { key: 'price', label: 'Prix IA', visible: true, width: 160, minWidth: 120, maxWidth: 220 },
    {
        key: 'model',
        label: 'Modèle IA',
        visible: false,
        width: 180,
        minWidth: 130,
        maxWidth: 250,
    },
    {
        key: 'input_tokens',
        label: 'Tokens In',
        visible: false,
        width: 160,
        minWidth: 120,
        maxWidth: 200,
    },
    {
        key: 'output_tokens',
        label: 'Tokens Out',
        visible: false,
        width: 160,
        minWidth: 120,
        maxWidth: 200,
    },
    {
        key: 'image_url',
        label: 'Image',
        visible: true,
        width: 160,
        minWidth: 120,
        maxWidth: 250,
    },
    { key: 'link_url', label: 'Lien', visible: true, width: 160, minWidth: 120, maxWidth: 250 },
    {
        key: 'location_id',
        label: 'Location ID',
        visible: false,
        width: 200,
        minWidth: 150,
        maxWidth: 300,
    },
    {
        key: 'account_id',
        label: 'Account ID',
        visible: false,
        width: 200,
        minWidth: 150,
        maxWidth: 300,
    },
    {
        key: 'notion_id',
        label: 'Notion ID',
        visible: false,
        width: 200,
        minWidth: 150,
        maxWidth: 300,
    },
    {
        key: 'informations',
        label: 'Informations',
        visible: true,
        width: 300,
        minWidth: 200,
        maxWidth: 500,
    },
    {
        key: 'actions',
        label: 'Actions',
        visible: true,
        width: 220,
        minWidth: 180,
        maxWidth: 280,
        required: true,
    },
]

interface UseColumnPersistenceReturn {
    columns: ColumnConfig[]
    setColumns: (columns: ColumnConfig[]) => void
    resetWidths: () => void
    resetToDefaults: () => void
    isLoaded: boolean
    isSaving: boolean
}

/**
 * Hook pour gérer la persistance des configurations de colonnes
 * Sauvegarde automatiquement les changements dans localStorage
 */
export const useColumnPersistence = (): UseColumnPersistenceReturn => {
    const [columns, setColumnsState] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Charger la configuration depuis localStorage au montage
    useEffect(() => {
        try {
            const savedColumns = localStorage.getItem(STORAGE_KEY)
            if (savedColumns) {
                const parsedColumns = JSON.parse(savedColumns) as ColumnConfig[]
                
                // Validation et fusion avec les colonnes par défaut
                // pour gérer les nouvelles colonnes qui pourraient être ajoutées
                const mergedColumns = mergeWithDefaults(parsedColumns, DEFAULT_COLUMNS)
                
                setColumnsState(mergedColumns)
                console.log('📋 Configuration des colonnes chargée depuis localStorage:', mergedColumns)
            } else {
                console.log('📋 Aucune configuration sauvegardée, utilisation des valeurs par défaut')
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration des colonnes:', error)
            // En cas d'erreur, utiliser les valeurs par défaut
            setColumnsState(DEFAULT_COLUMNS)
        } finally {
            setIsLoaded(true)
        }
    }, [])

    // Sauvegarder dans localStorage avec debouncing
    const saveToStorage = useCallback((newColumns: ColumnConfig[]) => {
        setIsSaving(true)
        
        // Annuler la sauvegarde précédente si elle existe
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        
        // Programmer une nouvelle sauvegarde après 300ms
        saveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns))
                console.log('💾 Configuration des colonnes sauvegardée:', newColumns)
            } catch (error) {
                console.error('❌ Erreur lors de la sauvegarde de la configuration des colonnes:', error)
            } finally {
                setIsSaving(false)
                saveTimeoutRef.current = null
            }
        }, 300)
    }, [])

    // Sauvegarder dans localStorage à chaque changement
    const setColumns = useCallback((newColumns: ColumnConfig[]) => {
        setColumnsState(newColumns)
        saveToStorage(newColumns)
    }, [saveToStorage])

    // Nettoyer le timeout au démontage
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [])

    // Réinitialiser uniquement les largeurs
    const resetWidths = useCallback(() => {
        const resetColumns = columns.map((col) => {
            const defaultCol = DEFAULT_COLUMNS.find((def) => def.key === col.key)
            return defaultCol ? { ...col, width: defaultCol.width } : col
        })
        setColumns(resetColumns)
        console.log('🔄 Largeurs des colonnes réinitialisées')
    }, [columns, setColumns])

    // Réinitialiser complètement aux valeurs par défaut
    const resetToDefaults = useCallback(() => {
        setColumns(DEFAULT_COLUMNS)
        console.log('🔄 Configuration des colonnes réinitialisée aux valeurs par défaut')
    }, [setColumns])

    return {
        columns,
        setColumns,
        resetWidths,
        resetToDefaults,
        isLoaded,
        isSaving,
    }
}

/**
 * Fusionne les colonnes sauvegardées avec les colonnes par défaut
 * Permet de gérer l'ajout de nouvelles colonnes sans perdre la configuration existante
 */
function mergeWithDefaults(saved: ColumnConfig[], defaults: ColumnConfig[]): ColumnConfig[] {
    const merged: ColumnConfig[] = []
    const savedMap = new Map(saved.map((col) => [col.key, col]))

    // Pour chaque colonne par défaut
    for (const defaultCol of defaults) {
        const savedCol = savedMap.get(defaultCol.key)
        
        if (savedCol) {
            // Utiliser la configuration sauvegardée mais s'assurer que les champs obligatoires sont présents
            merged.push({
                ...defaultCol, // Utiliser les valeurs par défaut comme base
                ...savedCol,   // Écraser avec les valeurs sauvegardées
                // S'assurer que les propriétés critiques restent cohérentes
                key: defaultCol.key,
                label: defaultCol.label,
                required: defaultCol.required,
                minWidth: defaultCol.minWidth,
                maxWidth: defaultCol.maxWidth,
            })
        } else {
            // Nouvelle colonne, utiliser la configuration par défaut
            merged.push(defaultCol)
        }
    }

    return merged
}

export { DEFAULT_COLUMNS }
