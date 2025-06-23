import { Alert, Text } from '@mantine/core'
import { LuBadgeAlert } from 'react-icons/lu'

interface ConfigurationAlertProps {
    hasNotionId?: boolean
    userDatabase?: string
    userNotionId?: string | null
}

export const ConfigurationAlert = ({ 
    hasNotionId, 
    userDatabase, 
    userNotionId 
}: ConfigurationAlertProps) => {
    if (hasNotionId) return null

    return (
        <Alert
            icon={<LuBadgeAlert size={16} />}
            title="Configuration Notion manquante"
            color="orange"
        >
            <Text size="sm">
                Votre compte n'est pas encore lié à un référenceur Notion. Contactez
                l'administrateur pour configurer votre accès.
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
                Base de données utilisée : {userDatabase} | Notion ID :{' '}
                {userNotionId || 'Non défini'}
            </Text>
        </Alert>
    )
}
