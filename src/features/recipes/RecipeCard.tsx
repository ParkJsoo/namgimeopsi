import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecipeRecommendation } from '../domain/recipe-ranking';

export function RecipeCard({
  recommendation,
  onPress,
}: {
  recommendation: RecipeRecommendation;
  onPress: () => void;
}) {
  const { recipe, reason } = recommendation;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>{recipe.cookMinutes}분 · {recipe.servings}인분</Text>
        <Text style={styles.reason}>{reason}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D5E0D6', marginBottom: 12 },
  copy: { paddingHorizontal: 20, paddingVertical: 20 },
  title: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: '#1D211C' },
  meta: { marginTop: 8, fontSize: 12, lineHeight: 18, color: '#6C7168' },
  reason: { marginTop: 8, fontSize: 12, lineHeight: 18, color: '#2F6B4F' },
});
