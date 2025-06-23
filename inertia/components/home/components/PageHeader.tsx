import { Box, Flex, Text, Title } from '@mantine/core'

export const PageHeader = () => {
    return (
        <Flex justify="space-between" align="center">
            <Box>
                <Title order={1}>Tableau de bord GMB & Notion</Title>
                <Text size="lg" c="dimmed" mt="xs">
                    Gestion des posts GMB et synchronisation avec Notion
                </Text>
            </Box>
        </Flex>
    )
}
