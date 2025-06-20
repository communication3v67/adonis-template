import { useState, useCallback, useRef, useEffect } from 'react'
import { Box, Table, Text, Group } from '@mantine/core'
import { LuGripVertical } from 'react-icons/lu'

interface ResizableColumnProps {
    children: React.ReactNode
    width: number
    minWidth?: number
    maxWidth?: number
    onResize: (newWidth: number) => void
    style?: React.CSSProperties
}

export const ResizableColumn = ({ 
    children, 
    width, 
    minWidth = 60, 
    maxWidth = 800, 
    onResize, 
    style = {} 
}: ResizableColumnProps) => {
    const [isResizing, setIsResizing] = useState(false)
    const startXRef = useRef<number>(0)
    const startWidthRef = useRef<number>(width)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
        startXRef.current = e.clientX
        startWidthRef.current = width
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [width])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return

        const diff = e.clientX - startXRef.current
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + diff))
        onResize(newWidth)
    }, [isResizing, minWidth, maxWidth, onResize])

    const handleMouseUp = useCallback(() => {
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }, [])

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isResizing, handleMouseMove, handleMouseUp])

    return (
        <Table.Th
            style={{
                ...style,
                width: `${width}px`,
                minWidth: `${width}px`,
                position: 'relative',
                padding: '8px',
                verticalAlign: 'middle',
                borderRight: '1px solid #e9ecef'
            }}
        >
            <Group justify="space-between" wrap="nowrap" gap={4}>
                <Box flex={1}>
                    {children}
                </Box>
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.4,
                        transition: 'opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.4'
                    }}
                >
                    <LuGripVertical size={14} color="#868e96" />
                </Box>
            </Group>
            {/* Handle de redimensionnement */}
            <Box
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: '-2px',
                    width: '4px',
                    height: '100%',
                    cursor: 'col-resize',
                    backgroundColor: isResizing ? '#228be6' : '#dee2e6',
                    opacity: isResizing ? 0.8 : 0.3,
                    transition: 'all 0.15s ease',
                    zIndex: 10,
                    borderRadius: '2px',
                    boxShadow: isResizing ? '0 0 4px rgba(34, 139, 230, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.7'
                    e.currentTarget.style.backgroundColor = '#228be6'
                    e.currentTarget.style.transform = 'scaleX(1.2)'
                }}
                onMouseLeave={(e) => {
                    if (!isResizing) {
                        e.currentTarget.style.opacity = '0.3'
                        e.currentTarget.style.backgroundColor = '#dee2e6'
                        e.currentTarget.style.transform = 'scaleX(1)'
                    }
                }}
            />
        </Table.Th>
    )
}
