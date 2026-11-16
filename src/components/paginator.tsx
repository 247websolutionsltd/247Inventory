import { Colors } from "@/constants/theme";
import { View } from "react-native";

export default function Paginator({ count, currentIndex }: { count: number; currentIndex: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ height: 6, width: currentIndex === i ? 30 : 12, borderRadius: 2, backgroundColor: currentIndex === i ? Colors.brass : "rgba(255,248,236,0.25)" }} />
      ))}
    </View>
  );
}
