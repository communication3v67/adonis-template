import { Alert, Text } from '@mantine/core'
import { LuBadgeAlert } from 'react-icons/lu'

interface ErrorAlertProps {
    error?: {
        message: string
        details: string
    }
}

export const ErrorAlert = ({ error }: ErrorAlertProps) => {
    if (!error) return null

    return (
        <Alert
            icon={<LuBadgeAlert size={16} />}
            title="Erreur de connexion a Notion"
            color="red"
        >
            <Text size="sm">{error.message}</Text>
            <Text size="xs" c="dimmed" mt="xs">
                {error.details}
            </Text>
        </Alert>
    )
}
