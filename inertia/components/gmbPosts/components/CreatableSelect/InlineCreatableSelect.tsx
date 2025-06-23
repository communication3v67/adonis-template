import { useState, useEffect } from 'react'
import { Combobox, InputBase, useCombobox, ScrollArea, Text } from '@mantine/core'

interface InlineCreatableSelectProps {
    data: { value: string; label: string }[]
    value: string | null
    onChange: (value: string | null) => void
    onCreate?: (query: string) => void
    placeholder?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

export function InlineCreatableSelect({
    data,
    value,
    onChange,
    onCreate,
    placeholder,
    size = 'sm',
    onKeyDown
}: InlineCreatableSelectProps) {
    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption()
            // Remettre la valeur sélectionnée dans le champ de recherche
            const selectedOption = data.find((item) => item.value === value)
            setSearch(selectedOption?.label || value || '')
        }
    })

    const [search, setSearch] = useState(() => {
        // Initialiser avec le label de l'option sélectionnée
        const selectedOption = data.find((item) => item.value === value)
        return selectedOption?.label || value || ''
    })

    // Mettre à jour le champ de recherche quand la valeur change
    useEffect(() => {
        const selectedOption = data.find((item) => item.value === value)
        setSearch(selectedOption?.label || value || '')
    }, [value, data])

    // Pour le statut, on ne filtre jamais - toutes les options sont toujours visibles
    const isStatusField = data.some(item => 
        ['Titre généré', 'Post à générer', 'Post généré', 'Post à publier', 'Publié', 'failed'].includes(item.value)
    )

    // Filtrer les options seulement si ce n'est pas le champ statut
    const filteredOptions = isStatusField 
        ? data // Pas de filtrage pour le statut
        : data.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase().trim())
          )

    // Vérifier si la valeur recherchée existe déjà (seulement pour les champs autres que statut)
    const exactOptionMatch = isStatusField 
        ? false // Pas de création d'option pour le statut
        : data.some((item) => 
            item.value.toLowerCase() === search.toLowerCase().trim() ||
            item.label.toLowerCase() === search.toLowerCase().trim()
          )

    // Créer les options du dropdown
    const options = filteredOptions.map((item) => (
        <Combobox.Option value={item.value} key={item.value}>
            {item.label}
        </Combobox.Option>
    ))

    // Option pour créer une nouvelle valeur (pas pour le statut)
    const shouldShowCreateOption = onCreate && !isStatusField && search.trim() !== '' && !exactOptionMatch
    
    if (shouldShowCreateOption) {
        options.push(
            <Combobox.Option value="$create" key="$create">
                <Text size="xs" c="blue">+ Créer "{search.trim()}"</Text>
            </Combobox.Option>
        )
    }

    const selectedOption = data.find((item) => item.value === value)

    return (
        <Combobox
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(val) => {
                if (val === '$create' && onCreate) {
                    const newValue = search.trim()
                    onCreate(newValue)
                    onChange(newValue)
                    // Mettre à jour le champ de recherche avec la nouvelle valeur
                    setSearch(newValue)
                } else {
                    onChange(val)
                    // Mettre à jour le champ de recherche avec le label de l'option sélectionnée
                    const selectedOption = data.find(item => item.value === val)
                    setSearch(selectedOption?.label || val)
                }
                combobox.closeDropdown()
            }}
        >
            <Combobox.Target>
                <InputBase
                    component="input"
                    type="text"
                    rightSection={<Combobox.Chevron />}
                    rightSectionPointerEvents="none"
                    onFocus={() => {
                        combobox.openDropdown()
                        // Sélectionner tout le texte au focus seulement si ce n'est pas le statut
                        if (!isStatusField) {
                            setTimeout(() => {
                                const input = document.activeElement as HTMLInputElement
                                if (input) input.select()
                            }, 0)
                        }
                    }}
                    onBlur={() => {
                        combobox.closeDropdown()
                        // Remettre la valeur sélectionnée
                        const selectedOption = data.find((item) => item.value === value)
                        setSearch(selectedOption?.label || value || '')
                    }}
                    placeholder={placeholder}
                    value={search}
                    onChange={(event) => {
                        const newValue = event.currentTarget.value
                        
                        // Pour le statut, on ne modifie pas la recherche avec la saisie utilisateur
                        if (!isStatusField) {
                            combobox.updateSelectedOptionIndex()
                            setSearch(newValue)
                            // Ouvrir le dropdown seulement si on tape quelque chose
                            if (newValue.length > 0 || combobox.dropdownOpened) {
                                combobox.openDropdown()
                            }
                        }
                    }}
                    onKeyDown={onKeyDown}
                    size={size}
                    style={{ width: '100%' }}
                    readOnly={isStatusField} // Lecture seule pour le statut
                />
            </Combobox.Target>

            <Combobox.Dropdown>
                <Combobox.Options>
                    <ScrollArea.Autosize mah={200} type="scroll">
                        {options.length > 0 ? (
                            options
                        ) : (
                            <Combobox.Empty>Aucune option trouvée</Combobox.Empty>
                        )}
                    </ScrollArea.Autosize>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    )
}
