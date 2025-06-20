import { TextInput } from '@mantine/core'
import { LuSearch } from 'react-icons/lu'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    onEnterKey?: () => void
}

export const SearchInput = ({ value, onChange, onEnterKey }: SearchInputProps) => {
    return (
        <TextInput
            placeholder="Rechercher dans le texte, mots-clés, clients, projets..."
            leftSection={<LuSearch size={16} />}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && onEnterKey) {
                    onEnterKey()
                }
            }}
        />
    )
}
