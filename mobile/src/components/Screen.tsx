import { type PropsWithChildren } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  if (scroll) {
    return <ScrollView contentContainerStyle={styles.container}>{children}</ScrollView>
  }

  return <View style={styles.container}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
})
