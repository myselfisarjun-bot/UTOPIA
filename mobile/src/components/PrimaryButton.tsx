import { Pressable, StyleSheet, Text, View } from 'react-native'

export function PrimaryButton(props: {
  title: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.button,
        props.disabled && styles.buttonDisabled,
        pressed && !props.disabled && styles.buttonPressed,
      ]}
    >
      <View>
        <Text style={styles.text}>{props.title}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
