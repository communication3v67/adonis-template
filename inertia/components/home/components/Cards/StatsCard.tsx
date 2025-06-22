import { Box, Card, Group, Text } from '@mantine/core'
import { ReactNode } from 'react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: ReactNode
    color?: string
}

export const StatsCard = ({ title, value, icon, color = '#228be6' }: StatsCardProps) => {
    return (
        <Card withBorder p="md">
            <Group justify="space-between">
                <Box>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {title}
                    </Text>
                    <Text size="xl" fw={700}>
                        {value}
                    </Text>
                </Box>
                <div style={{ color }}>{icon}</div>
            </Group>
        </Card>
    )
}
