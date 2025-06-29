import { TextInput } from '@mantine/core'
import { LuSearch, LuX } from 'react-icons/lu'
import { useState, useEffect, useRef } from 'react'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    onEnterKey?: () => void
}

export const SearchInput = ({ value, onChange, onEnterKey }: SearchInputProps) => {
    // État local pour contrôler complètement le champ
    const [localValue, setLocalValue] = useState(value)
    const isUserInput = useRef(false)

    // Synchroniser avec la prop value SEULEMENT si ce n'est pas une saisie utilisateur
    useEffect(() => {
        if (!isUserInput.current && localValue !== value) {
            console.log('🔄 SearchInput: Synchronisation avec prop value')
            console.log('  - Valeur locale:', localValue)
            console.log('  - Nouvelle prop:', value)
            setLocalValue(value)
        }
        // Reset du flag après synchronisation
        isUserInput.current = false
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        console.log('⌨️ SearchInput: Changement utilisateur:', newValue)
        
        // Marquer comme saisie utilisateur pour éviter l'écrasement
        isUserInput.current = true
        
        // Mettre à jour immédiatement l'état local
        setLocalValue(newValue)
        
        // Notifier le parent
        onChange(newValue)
    }

    const handleClear = () => {
        console.log('🧹 SearchInput: Effacement du champ')
        isUserInput.current = true
        setLocalValue('')
        onChange('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onEnterKey) {
            e.preventDefault()
            console.log('⏎ SearchInput: Touche Entrée pressée')
            onEnterKey()
        }
    }

    return (
        <TextInput
            placeholder="Rechercher dans le texte, mots-clés, clients, projets..."
            leftSection={<LuSearch size={16} />}
            rightSection={
                localValue ? (
                    <LuX 
                        size={16} 
                        style={{ cursor: 'pointer', color: 'var(--mantine-color-gray-6)' }}
                        onClick={handleClear}
                        title="Effacer la recherche"
                    />
                ) : null
            }
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    )
}
