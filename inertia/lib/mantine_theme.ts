import { generateColors } from '@mantine/colors-generator'
import { createTheme, TableThead } from '@mantine/core'

const mantineTheme = createTheme({
    colors: {
        primary: generateColors('#ff7900'),
        secondary: generateColors('#0086FF'),
    },
    primaryColor: 'primary',
    components: {
        TableThead: TableThead.extend({
            defaultProps: {
                bg: 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                style: {
                    // Fix the gap on top of the thead when position is sticky
                    // as the border is set on the table itself and not the thead.
                    outline:
                        'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)',
                },
            },
        }),
    },
})

export default mantineTheme
